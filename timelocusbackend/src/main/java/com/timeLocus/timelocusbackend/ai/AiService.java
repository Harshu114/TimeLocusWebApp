package com.timeLocus.timelocusbackend.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.timeLocus.timelocusbackend.user.User;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.TimeUnit;
import java.util.logging.Logger;

@Service
public class AiService {

    private static final Logger log = Logger.getLogger(AiService.class.getName());
    private final ObjectMapper  mapper = new ObjectMapper();

    @Value("${ai.provider:ollama}")
    private String provider;

    @Value("${ai.ollama.base-url:http://localhost:11434}")
    private String ollamaBaseUrl;

    @Value("${ai.ollama.model:phi3:mini}")
    private String ollamaModel;

    @Value("${ai.groq.api-key:}")
    private String groqKey;

    @Value("${ai.groq.base-url:https://api.groq.com/openai/v1}")
    private String groqBaseUrl;

    @Value("${ai.groq.model:llama3-8b-8192}")
    private String groqModel;

    private final OkHttpClient httpClient = new OkHttpClient.Builder()
            .connectTimeout(10, TimeUnit.SECONDS)
            .readTimeout(120,   TimeUnit.SECONDS)
            .writeTimeout(10,   TimeUnit.SECONDS)
            .build();

    // ── Public API ────────────────────────────────────────────────────────────

    public String chat(User user, String message, String context) {
        // Planner mode: bypass system prompt, maximise tokens for JSON output
        boolean isPlanner = "planner".equalsIgnoreCase(context);
        if (isPlanner) {
            String plannerSystem =
                "You are a JSON planner. Output ONLY a valid JSON array. " +
                "No markdown fences, no explanation text, no commentary. " +
                "Start your response with [ and end with ].";
            return callWithFallback(plannerSystem, message, 1400);
        }
        return callWithFallback(buildSystemPrompt(user, context), message, 400);
    }

    public String generateInsights(User user) {
        String system = String.format(
            "You are a productivity coach for %s professionals. " +
            "Give exactly 3 short actionable insights, numbered 1-3. Under 80 words total.",
            user.getUserType().name().replace("_", " ")
        );
        return callWithFallback(system,
            "Give me 3 productivity insights for today for " + user.getFirstName() + ".", 400);
    }

    public List<String> generateRecallQuestions(String topic, String difficulty, int count) {
        String system = "You are a tutor. Return ONLY a numbered list of questions. No intro text.";
        String prompt = String.format(
            "Generate %d %s difficulty active recall questions about: %s",
            count, difficulty != null ? difficulty : "medium", topic
        );
        return callWithFallback(system, prompt, 400)
                .lines()
                .map(String::trim)
                .filter(l -> !l.isBlank())
                .limit(count)
                .toList();
    }

    private String buildSystemPrompt(User user, String context) {
        String role = switch (user.getUserType()) {
            case STUDENT ->
                "a student. Help with study techniques, exam prep, time blocking, active recall. Motivate with relevant quotes.";
            case CORPORATE ->
                "a corporate professional. Help with meeting efficiency, KPIs, work-life balance, productivity and pressure management.";
            case SELF_EMPLOYED ->
                "self-employed. Help with project management, client work, and business growth.";
            case WELLBEING ->
                "focused on personal wellbeing. Help with habit building, mindfulness, journaling, and self-improvement.";
        };
        return String.format(
            "You are TimeLocus AI — a smart, friendly productivity assistant. " +
            "User name: %s. They are %s " +
            "Context: %s. " +
            "Be concise (under 120 words), practical, and positive. " +
            "Never mention that you are a language model.",
            user.getFirstName(), role,
            context != null && !context.isBlank() ? context : "general chat"
        );
    }

    // ── Routing ───────────────────────────────────────────────────────────────

    private String callWithFallback(String system, String userMsg, int maxTokens) {
        if ("ollama".equalsIgnoreCase(provider)) {
            try {
                String result = callOllama(system, userMsg, maxTokens);
                if (result != null && !result.isBlank()) return result;
            } catch (Exception e) {
                log.warning("Ollama failed (" + e.getMessage() + "), trying Groq fallback...");
            }
            if (!groqKey.isBlank()) {
                try {
                    return callGroq(system, userMsg, maxTokens);
                } catch (Exception e) {
                    log.warning("Groq fallback also failed: " + e.getMessage());
                }
            }
        } else {
            try {
                return callGroq(system, userMsg, maxTokens);
            } catch (Exception e) {
                log.warning("Groq failed: " + e.getMessage());
            }
        }
        return "I'm having trouble connecting right now. Please check that Ollama is running " +
               "(run 'ollama serve' in a terminal) or add a Groq API key as fallback.";
    }

    // ── Ollama ────────────────────────────────────────────────────────────────

    private String callOllama(String system, String userMsg, int maxTokens) throws Exception {
        var messages = mapper.createArrayNode();

        var systemMsg = mapper.createObjectNode();
        systemMsg.put("role", "system");
        systemMsg.put("content", system);
        messages.add(systemMsg);

        var userMessage = mapper.createObjectNode();
        userMessage.put("role", "user");
        userMessage.put("content", userMsg);
        messages.add(userMessage);

        var options = mapper.createObjectNode();
        options.put("num_predict", maxTokens);
        options.put("temperature", 0.3);   // lower = more deterministic JSON

        var bodyNode = mapper.createObjectNode();
        bodyNode.put("model", ollamaModel);
        bodyNode.set("messages", messages);
        bodyNode.put("stream", false);
        bodyNode.set("options", options);

        String body = mapper.writeValueAsString(bodyNode);

        Request request = new Request.Builder()
                .url(ollamaBaseUrl + "/api/chat")
                .post(RequestBody.create(body, MediaType.parse("application/json")))
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful() || response.body() == null) {
                throw new RuntimeException("Ollama HTTP " + response.code());
            }
            var json = mapper.readTree(response.body().string());
            String content = json.at("/message/content").asText();
            if (content.isBlank()) throw new RuntimeException("Empty Ollama response");
            return content.trim();
        }
    }

    // ── Groq ──────────────────────────────────────────────────────────────────

    private String callGroq(String system, String userMsg, int maxTokens) throws Exception {
        if (groqKey.isBlank()) throw new RuntimeException("No Groq API key configured");

        var messages = mapper.createArrayNode();

        var systemMsg = mapper.createObjectNode();
        systemMsg.put("role", "system");
        systemMsg.put("content", system);
        messages.add(systemMsg);

        var userMessage = mapper.createObjectNode();
        userMessage.put("role", "user");
        userMessage.put("content", userMsg);
        messages.add(userMessage);

        var bodyNode = mapper.createObjectNode();
        bodyNode.put("model", groqModel);
        bodyNode.set("messages", messages);
        bodyNode.put("max_tokens", Math.min(maxTokens, 8000));
        bodyNode.put("temperature", 0.3);

        String body = mapper.writeValueAsString(bodyNode);

        Request request = new Request.Builder()
                .url(groqBaseUrl + "/chat/completions")
                .post(RequestBody.create(body, MediaType.parse("application/json")))
                .addHeader("Authorization", "Bearer " + groqKey)
                .build();

        try (Response response = httpClient.newCall(request).execute()) {
            if (!response.isSuccessful() || response.body() == null) {
                throw new RuntimeException("Groq HTTP " + response.code());
            }
            var json = mapper.readTree(response.body().string());
            return json.at("/choices/0/message/content").asText().trim();
        }
    }
}