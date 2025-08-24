using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BarberiaSoftwareAPIs.Models
{
    public class Appointments
    {
        public int AppointmentId { get; set; }

        [Required(ErrorMessage = "El cliente es obligatorio.")]
        public int ClientId { get; set; }

        [Required(ErrorMessage = "El empleado es obligatorio.")]
        public int EmployeeId { get; set; }

        [Required(ErrorMessage = "La fecha es obligatoria.")]
        public DateTime Date { get; set; }

        [Required(ErrorMessage = "La hora de inicio es obligatoria.")]
        public TimeSpan StartTime { get; set; }

        [Required(ErrorMessage = "La hora de fin es obligatoria.")]
        public TimeSpan EndTime { get; set; }

        [StringLength(1000, ErrorMessage = "Las notas no pueden exceder los 1000 caracteres.")]
        public string? Notes { get; set; }

        [Required(ErrorMessage = "El estado es obligatorio.")]
        [StringLength(20, ErrorMessage = "El estado no puede exceder los 20 caracteres.")] // Pending/Confirmed/Cancelled/Completed
        public string Status { get; set; } = "Pending";

        public bool IsActive { get; set; } = true;

        // Campos auxiliares (salida de SPs / joins)
        [NotMapped] public string? ClientName { get; set; }
        [NotMapped] public string? EmployeeName { get; set; }

        // Mensajería de SPs
        [NotMapped] public int Success { get; set; } = 0;
        [NotMapped] public string? Message { get; set; }
    }
}