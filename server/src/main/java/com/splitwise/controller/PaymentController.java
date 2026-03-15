package com.splitwise.controller;

import com.splitwise.dto.MarkPaidRequest;
import com.splitwise.dto.PaymentDTO;
import com.splitwise.entity.User;
import com.splitwise.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/mark-paid")
    public ResponseEntity<PaymentDTO> markPaid(@Valid @RequestBody MarkPaidRequest request) {
        return ResponseEntity.ok(paymentService.markPaid(request));
    }

    @GetMapping("/history")
    public ResponseEntity<List<PaymentDTO>> getHistory(@AuthenticationPrincipal User currentUser) {
        return ResponseEntity.ok(paymentService.getPaymentHistory(currentUser));
    }

    @GetMapping("/generate-upi")
    public ResponseEntity<Map<String, String>> generateUpi(
            @RequestParam String upiId,
            @RequestParam String name,
            @RequestParam String amount) {
        String link = paymentService.generateUpiLink(upiId, name, amount);
        return ResponseEntity.ok(Map.of("upiLink", link));
    }
}
