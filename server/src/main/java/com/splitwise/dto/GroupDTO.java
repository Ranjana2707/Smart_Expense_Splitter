package com.splitwise.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
public class GroupDTO {
    private Long id;
    private String name;
    private String description;
    private List<UserDTO> members;
    private List<ExpenseDTO> expenses;
    private LocalDateTime createdAt;
}
