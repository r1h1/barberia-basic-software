using System.ComponentModel.DataAnnotations;

namespace BarberiaSoftwareAPIs.Models
{
    public class Roles
    {
        [Required]
        public int RoleId { get; set; }
        [Required]
        public string RoleName { get; set; }
        public string? MenuAccess { get; set; }
        [Required]
        public bool IsActive { get; set; }
    }
}