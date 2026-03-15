package com.splitwise.service;

import com.splitwise.dto.MarkPaidRequest;
import com.splitwise.dto.PaymentDTO;
import com.splitwise.dto.UserDTO;
import com.splitwise.entity.Group;
import com.splitwise.entity.Payment;
import com.splitwise.entity.User;
import com.splitwise.exception.AppException;
import com.splitwise.repository.PaymentRepository;
import com.splitwise.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final GroupService groupService;

    public PaymentDTO markPaid(MarkPaidRequest request) {
        User fromUser = userRepository.findById(request.getFromUserId())
                .orElseThrow(() -> new AppException("From user not found", HttpStatus.NOT_FOUND));
        User toUser = userRepository.findById(request.getToUserId())
                .orElseThrow(() -> new AppException("To user not found", HttpStatus.NOT_FOUND));
        Group group = groupService.getGroupEntity(request.getGroupId());

        Payment payment = Payment.builder()
                .fromUser(fromUser)
                .toUser(toUser)
                .amount(request.getAmount())
                .group(group)
                .status("COMPLETED")
                .build();

        payment = paymentRepository.save(payment);
        return toDTO(payment);
    }

    public List<PaymentDTO> getPaymentHistory(User user) {
        return paymentRepository.findByFromUserOrToUserOrderByPaidAtDesc(user, user)
                .stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public String generateUpiLink(String upiId, String name, String amount) {
        return String.format("upi://pay?pa=%s&pn=%s&am=%s&cu=INR",
                URLEncoder.encode(upiId, StandardCharsets.UTF_8),
                URLEncoder.encode(name, StandardCharsets.UTF_8),
                URLEncoder.encode(amount, StandardCharsets.UTF_8));
    }

    private PaymentDTO toDTO(Payment payment) {
        return new PaymentDTO(
                payment.getId(),
                new UserDTO(payment.getFromUser().getId(), payment.getFromUser().getName(), payment.getFromUser().getEmail()),
                new UserDTO(payment.getToUser().getId(), payment.getToUser().getName(), payment.getToUser().getEmail()),
                payment.getAmount(),
                payment.getGroup().getId(),
                payment.getGroup().getName(),
                payment.getPaidAt(),
                payment.getStatus()
        );
    }
}
