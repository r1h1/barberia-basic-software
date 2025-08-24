using System.ComponentModel.DataAnnotations;

namespace BarberiaSoftwareAPIs.Models
{
    public class Services
    {
        public int ServiceId { get; set; }

        [Required(ErrorMessage = "El nombre del servicio es obligatorio.")]
        [StringLength(120, ErrorMessage = "El nombre del servicio no puede exceder los 120 caracteres.")]
        public string Name { get; set; }

        [StringLength(500, ErrorMessage = "La descripción no puede exceder los 500 caracteres.")]
        public string? Description { get; set; }

        [Required(ErrorMessage = "El precio base es obligatorio.")]
        [Range(0.01, 99999999.99, ErrorMessage = "El precio debe ser mayor que cero.")]
        public decimal BasePrice { get; set; }

        [Required(ErrorMessage = "La duración del servicio es obligatoria.")]
        [Range(1, 1440, ErrorMessage = "La duración debe estar entre 1 y 1440 minutos.")]
        public int DurationMin { get; set; }

        [Required(ErrorMessage = "El estado del servicio es obligatorio.")]
        public bool IsActive { get; set; }

        // Propiedades para respuesta del SP
        public bool? Success { get; set; }
        public string? Message { get; set; }
    }
}