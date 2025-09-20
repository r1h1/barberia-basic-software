using System.ComponentModel.DataAnnotations;

namespace BarberiaSoftwareAPIs.Models
{
    public class LoginRequest
    {
        [Required(ErrorMessage = "El campo Login es obligatorio.")]
        public string Login { get; set; } = string.Empty;

        [Required(ErrorMessage = "La contraseña es obligatoria.")]
        public string Password { get; set; } = string.Empty;
    }

    public class RegisterRequest
    {
        [Required(ErrorMessage = "El nombre de usuario es obligatorio.")]
        [StringLength(100, ErrorMessage = "El username no puede exceder los 100 caracteres.")]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "La contraseña es obligatoria.")]
        [MinLength(8, ErrorMessage = "La contraseña debe tener al menos 8 caracteres.")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "El ID del rol es obligatorio.")]
        public int RoleId { get; set; }

        public int? UserId { get; set; }
        public int? EmployeeId { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class ChangePasswordRequest
    {
        public int? AuthUserId { get; set; }
        public string? Username { get; set; }

        [Required(ErrorMessage = "La contraseña actual es obligatoria.")]
        public string CurrentPassword { get; set; } = string.Empty;

        [Required(ErrorMessage = "La nueva contraseña es obligatoria.")]
        [MinLength(8, ErrorMessage = "La nueva contraseña debe tener al menos 8 caracteres.")]
        public string NewPassword { get; set; } = string.Empty;
    }

    public class UpdateAuthUserRequest
    {
        [Required(ErrorMessage = "El ID de autenticación es obligatorio.")]
        public int AuthUserId { get; set; }

        [Required(ErrorMessage = "El nombre de usuario es obligatorio.")]
        [StringLength(100, ErrorMessage = "El username no puede exceder los 100 caracteres.")]
        public string Username { get; set; } = string.Empty;

        [Required(ErrorMessage = "El ID del rol es obligatorio.")]
        public int RoleId { get; set; }

        public int? UserId { get; set; }
        public int? EmployeeId { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class AuthResponse
    {
        public bool Success { get; set; }
        public string? Message { get; set; }
        public int? AuthUserId { get; set; }
        public string? Username { get; set; }
        public int? RoleId { get; set; }
        public string? RoleName { get; set; }
        public string? MenuAccess { get; set; }
        public int? UserId { get; set; }
        public int? EmployeeId { get; set; }
        public string? PersonName { get; set; }
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public bool? IsActive { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? LastLogin { get; set; }
    }
}