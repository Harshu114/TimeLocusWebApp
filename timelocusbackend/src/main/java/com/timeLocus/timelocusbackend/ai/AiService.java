package com.timeLocus.timelocusbackend.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.timeLocus.timelocusbackend.user.User;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.logging.Logger;

@Service
public class AiService {

    private static final Logger log = Logger.getLogger(AiService.class.getName());

    @Value("${ai.provider}")        private String provider;
    @Value("${ai.groq.api-key}")    private String groqKey;
    @Value("${ai.groq.base-url}")   private String groqBaseUrl;
    @Value("${ai.groq.model}")      private String groqModel;
    @Value("${ai.openai.api-key}")  private String openaiKey;
    @Value("${ai.openai.base-url}") private String openaiBaseUrl;
    @Value("${ai.openai.model}")    private String openaiModel;

    public String chat(User user, String message, String context) {
        String systemPrompt = String.format(
                "You are TimeLocus AI — a smart productivity assistant. " +
                "User: %s %s, type: %s. Context: %s. Be concise and practical.",
                user.getFirstName(), user.getLastName(),
                user.getUserType().name(),
                context != null ? context : "general"
        ); // when you want to give pre prompt then refer this code oaky???
        return callApi(systemPrompt, message);
    }

    public String generateInsights(User user) {
        String prompt = String.format(
                "You are a productivity analyst. User is a %s. " +
                "Give 3 concise, actionable productivity insights for today. Under 150 words.",
                user.getUserType().name()
        );
        return callApi(prompt, "Generate my daily insights.");
    }

    public List<String> generateRecallQuestions(String topic, String difficulty, int count) {
        String prompt = String.format(
                "Generate exactly %d active recall questions on: \"%s\". " +
                "Difficulty: %s. Return a numbered list only, no extra text.",
                count, topic, difficulty
        );
        String raw = callApi("You are an expert tutor.", prompt);
        return raw.lines()
                .filter(l -> !l.isBlank())
                .limit(count)
                .toList();
    }

    private String callApi(String systemPrompt, String userMessage) {
        try {
            String model  = "groq".equals(provider) ? groqModel  : openaiModel;
            String apiUrl = "groq".equals(provider)
                    ? groqBaseUrl + "/chat/completions"
                    : openaiBaseUrl + "/chat/completions";
            String apiKey = "groq".equals(provider) ? groqKey : openaiKey;

            String body = String.format(
                    "{\"model\":\"%s\",\"messages\":[" +
                    "{\"role\":\"system\",\"content\":%s}," +
                    "{\"role\":\"user\",\"content\":%s}" +
                    "],\"max_tokens\":1024,\"temperature\":0.7}",
                    model, jsonStr(systemPrompt), jsonStr(userMessage)
            );

            OkHttpClient client  = new OkHttpClient();
            RequestBody  reqBody = RequestBody.create(
                    body, MediaType.parse("application/json"));
            Request request = new Request.Builder()
                    .url(apiUrl)
                    .post(reqBody)
                    .addHeader("Authorization", "Bearer " + apiKey)
                    .addHeader("Content-Type", "application/json")
                    .build();

            try (Response response = client.newCall(request).execute()) {
                if (!response.isSuccessful() || response.body() == null) {
                    log.warning("AI API error: " + response.code());
                    return "AI service unavailable. Please try again.";
                }
                var json = new ObjectMapper().readTree(response.body().string());
                return json.at("/choices/0/message/content").asText();
            }
        } catch (Exception e) {
            log.warning("AI call failed: " + e.getMessage());
            return "AI service temporarily unavailable.";
        }
    }

    private String jsonStr(String s) {
        if (s == null) return "null";
        return "\"" + s.replace("\\", "\\\\")
                       .replace("\"", "\\\"")
                       .replace("\n", "\\n")
                       .replace("\r", "")
                + "\"";
    }
}