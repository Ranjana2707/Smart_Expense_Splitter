package com.splitwise.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class PaymentDTO {
    private Long id;
    private UserDTO fromUser;
    private UserDTO toUser;
    private BigDecimal amount;
    private Long groupId;
    private String groupName;
    private LocalDateTime paidAt;
    private String status;
}
