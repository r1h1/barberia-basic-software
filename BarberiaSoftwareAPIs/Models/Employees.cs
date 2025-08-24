using System.ComponentModel.DataAnnotations;

namespace BarberiaSoftwareAPIs.Models
{
    public class Employees
    {
        public int EmployeeId { get; set; }

        [Required(ErrorMessage = "El nombre es obligatorio.")]
        [StringLength(150, ErrorMessage = "El nombre no puede exceder los 150 caracteres.")]
        public string Name { get; set; }

        [EmailAddress(ErrorMessage = "El formato del email no es válido.")]
        [StringLength(255)]
        public string? Email { get; set; }

        [Phone(ErrorMessage = "El formato del teléfono no es válido.")]
        [StringLength(30)]
        public string? Phone { get; set; }

        [StringLength(30, ErrorMessage = "El CUI no puede exceder los 30 caracteres.")]
        public string? CUI { get; set; }

        [StringLength(120)]
        public string? Specialty { get; set; }

        public bool IsActive { get; set; }
    }
}