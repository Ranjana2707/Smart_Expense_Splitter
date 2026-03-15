package com.splitwise.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class SettlementDTO {
    private UserDTO from;
    private UserDTO to;
    private BigDecimal amount;
}
