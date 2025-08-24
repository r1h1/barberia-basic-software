using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BarberiaSoftwareAPIs.Models
{
    public class Schedules
    {
        public int ScheduleId { get; set; }

        [Required(ErrorMessage = "El empleado es obligatorio.")]
        public int EmployeeId { get; set; }

        [Required(ErrorMessage = "El día de la semana es obligatorio.")]
        [Range(1, 7, ErrorMessage = "DayOfWeek debe estar entre 1 y 7.")]
        public byte DayOfWeek { get; set; } // 1..7

        [Required(ErrorMessage = "La hora de inicio es obligatoria.")]
        public TimeSpan StartTime { get; set; }

        [Required(ErrorMessage = "La hora de fin es obligatoria.")]
        public TimeSpan EndTime { get; set; }

        public bool IsActive { get; set; } = true;

        // Para mensajes desde los SPs
        [NotMapped] public int Success { get; set; } = 0;
        [NotMapped] public string? Message { get; set; }
    }
}