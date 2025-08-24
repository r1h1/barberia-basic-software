using System.ComponentModel.DataAnnotations;

namespace BarberiaSoftwareAPIs.Models
{
    public class AppointmentServices
    {
        public int AppointmentServiceId { get; set; }

        [Required(ErrorMessage = "El ID de la cita es obligatorio.")]
        public int AppointmentId { get; set; }

        [Required(ErrorMessage = "El ID del servicio es obligatorio.")]
        public int ServiceId { get; set; }

        [Required(ErrorMessage = "La cantidad es obligatoria.")]
        [Range(1, int.MaxValue, ErrorMessage = "La cantidad debe ser mayor a 0.")]
        public int Quantity { get; set; }

        [Required(ErrorMessage = "El precio unitario es obligatorio.")]
        [Range(0, double.MaxValue, ErrorMessage = "El precio unitario debe ser mayor o igual a 0.")]
        public decimal UnitPrice { get; set; }

        [Required(ErrorMessage = "El total es obligatorio.")]
        [Range(0, double.MaxValue, ErrorMessage = "El total debe ser mayor o igual a 0.")]
        public decimal TotalPrice { get; set; }

        public bool IsActive { get; set; } = true;

        // Para mensajes desde el SP
        public int Success { get; set; }
        public string? Message { get; set; }
    }
}