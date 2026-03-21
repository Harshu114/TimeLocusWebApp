package com.timeLocus.timelocusbackend.ai;

import com.timeLocus.timelocusbackend.ai.dto.*;
import com.timeLocus.timelocusbackend.common.ApiResponse;
import com.timeLocus.timelocusbackend.user.User;
import jakarta.validation.Valid;
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

    // POST /ai/chat — send a message, get AI reply
    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ChatRequest req) {
        String reply = aiService.chat(user, req.message(), req.context());
        return ResponseEntity.ok(new ChatResponse(reply));
    }

    // GET /ai/insights — get productivity insights for today
    @GetMapping("/insights")
    public ResponseEntity<ApiResponse<String>> insights(
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(ApiResponse.success(aiService.generateInsights(user)));
    }

    // POST /ai/recall — generate active recall questions on a topic
    @PostMapping("/recall")
    public ResponseEntity<RecallResponse> activeRecall(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody RecallRequest req) {
        List<String> questions = aiService.generateRecallQuestions(
                req.topic(), req.difficulty(), req.count()
        );
        return ResponseEntity.ok(new RecallResponse(questions));
    }
}
