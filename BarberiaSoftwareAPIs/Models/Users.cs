using System.ComponentModel.DataAnnotations;

namespace BarberiaSoftwareAPIs.Models
{
    public class Users
    {
        [Required(ErrorMessage = "El ID de usuario es obligatorio.")]
        public int UserId { get; set; }

        [Required(ErrorMessage = "El nombre es obligatorio.")]
        [StringLength(100, ErrorMessage = "El nombre no puede exceder los 100 caracteres.")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "El correo es obligatorio.")]
        [EmailAddress(ErrorMessage = "Formato de correo inválido.")]
        [StringLength(200, ErrorMessage = "El correo no puede exceder los 200 caracteres.")]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "El número de teléfono es obligatorio.")]
        [StringLength(50, ErrorMessage = "El número de teléfono no puede exceder los 50 caracteres.")]
        public string Phone { get; set; } = string.Empty;

        public string? Role { get; set; } = string.Empty;

        [Required(ErrorMessage = "El estado activo/inactivo es obligatorio.")]
        public bool IsActive { get; set; }

        public int Success { get; set; } = 0;

        public string? Message { get; set; }
    }
}