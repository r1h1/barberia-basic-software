using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BarberiaSoftwareAPIs.Models
{
    public class Announcements
    {
        public int AnnouncementId { get; set; }

        [Required(ErrorMessage = "El ID del empleado es obligatorio.")]
        public int EmployeeId { get; set; }

        [Required(ErrorMessage = "El título es obligatorio.")]
        [StringLength(200, ErrorMessage = "El título no puede exceder los 200 caracteres.")]
        public string Title { get; set; } = string.Empty;

        public string? Content { get; set; }

        public DateTime PublishedDate { get; set; }

        public bool IsActive { get; set; }

        [NotMapped] public string? Message { get; set; }
        [NotMapped] public int? Success { get; set; }
        [NotMapped] public string? EmployeeName { get; set; }
    }
}