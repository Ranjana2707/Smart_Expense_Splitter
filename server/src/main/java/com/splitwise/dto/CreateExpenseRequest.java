package com.splitwise.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class CreateExpenseRequest {
    @NotBlank
    private String description;

    @NotNull @Positive
    private BigDecimal amount;

    @NotNull
    private Long paidById;

    @NotNull
    private Long groupId;

    private List<Long> splitAmongIds;
}
