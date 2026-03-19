package com.timeLocus.timelocusbackend.ai;

import com.timeLocus.timelocusbackend.common.ApiResponse;
import com.timeLocus.timelocusbackend.user.User;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/ai")
public class AiController {

    private final AiService aiService;

    public AiController(AiService aiService) {
        this.aiService = aiService;
    }

    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ChatRequest req) {
        String reply = aiService.chat(user, req.message(), req.context());
        return ResponseEntity.ok(new ChatResponse(reply));
    }

    @GetMapping("/insights")
    public ResponseEntity<ApiResponse<String>> insights(@AuthenticationPrincipal User user) {
        String insight = aiService.generateInsights(user);
        return ResponseEntity.ok(ApiResponse.success(insight));
    }

    @PostMapping("/recall")
    public ResponseEntity<RecallResponse> activeRecall(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody RecallRequest req) {
        List<String> questions = aiService.generateRecallQuestions(
                req.topic(), req.difficulty(), req.count());
        return ResponseEntity.ok(new RecallResponse(questions));
    }

    // ── DTOs ──────────────────────────────────────────────────────────────────
    public record ChatRequest(@NotBlank String message, String context) {}
    public record ChatResponse(String reply) {}
    public record RecallRequest(String topic, String difficulty, int count) {}
    public record RecallResponse(List<String> questions) {}
}