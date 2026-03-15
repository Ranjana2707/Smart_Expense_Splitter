package com.splitwise.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExpenseDTO {
    private Long id;
    private String description;
    private BigDecimal amount;
    private UserDTO paidBy;
    private Long groupId;
    private List<UserDTO> splitAmong;
    private LocalDateTime createdAt;
}
