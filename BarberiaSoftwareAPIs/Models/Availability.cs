using System.ComponentModel.DataAnnotations;

namespace BarberiaSoftwareAPIs.Models
{
    public class AvailabilityModel
    {
        public int EmployeeId { get; set; }
        public string Name { get; set; }
        public string Specialty { get; set; }
        public string AvailableSlots { get; set; } // JSON desde BD
    }

    public class AvailabilityCheckRequest
    {
        [Required]
        public int EmployeeId { get; set; }

        [Required]
        public DateTime Date { get; set; }

        [Required]
        public TimeSpan StartTime { get; set; }
    }

    public class AvailabilityCheckResponse
    {
        public string Status { get; set; }
        public string Message { get; set; }
    }
}