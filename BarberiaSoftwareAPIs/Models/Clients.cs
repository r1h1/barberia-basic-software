using System;
using System.ComponentModel.DataAnnotations;

namespace BarberiaSoftwareAPIs.Models
{
    public class Clients
    {
        public int ClientId { get; set; }

        [Required(ErrorMessage = "El nombre es obligatorio.")]
        [StringLength(150, ErrorMessage = "El nombre no puede exceder los 150 caracteres.")]
        public string Name { get; set; }

        [Phone(ErrorMessage = "Formato de teléfono inválido.")]
        [StringLength(30)]
        public string? Phone { get; set; }

        [EmailAddress(ErrorMessage = "Formato de email inválido.")]
        [StringLength(255)]
        public string? Email { get; set; }

        [StringLength(20, ErrorMessage = "El género no puede exceder los 20 caracteres.")]
        public string? Gender { get; set; }

        public DateTime? RegistrationDate { get; set; }

        public bool IsActive { get; set; } = true;
    }
}