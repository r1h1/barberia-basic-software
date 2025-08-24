using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BarberiaSoftwareAPIs.Models
{
    public class Payments
    {
        public int PaymentId { get; set; }

        [Required(ErrorMessage = "La cita es obligatoria.")]
        public int AppointmentId { get; set; }

        [Required(ErrorMessage = "El cliente es obligatorio.")]
        public int ClientId { get; set; }

        [Required(ErrorMessage = "El tipo de pago es obligatorio.")]
        [StringLength(20, ErrorMessage = "El tipo de pago no puede exceder los 20 caracteres.")]
        public string PaymentType { get; set; } = string.Empty; // Cash/Transfer/Card/Other

        [StringLength(50)]
        public string? AuthorizationNumber { get; set; }

        [StringLength(50)]
        public string? TransactionNumber { get; set; }

        [Required(ErrorMessage = "El monto total es obligatorio.")]
        [Range(0, double.MaxValue, ErrorMessage = "El monto total debe ser mayor o igual a 0.")]
        public decimal TotalAmount { get; set; }

        public DateTime? PaymentDate { get; set; }

        [StringLength(20, ErrorMessage = "El estado no puede exceder los 20 caracteres.")]
        public string? Status { get; set; } // Paid/Pending/Voided/etc.

        public bool IsActive { get; set; } = true;

        // Campos de JOIN (pay_List / pay_GetById)
        [NotMapped] public DateTime? AppointmentDate { get; set; }
        [NotMapped] public TimeSpan? StartTime { get; set; }
        [NotMapped] public TimeSpan? EndTime { get; set; }
        [NotMapped] public string? AppointmentStatus { get; set; }
        [NotMapped] public string? ClientName { get; set; }

        // Respuesta de SPs
        [NotMapped] public int Success { get; set; } = 0;
        [NotMapped] public string? Message { get; set; }
    }
}