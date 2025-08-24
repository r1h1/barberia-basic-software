using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace BarberiaSoftwareAPIs.Models
{
    public class Roles
    {
        [Required(ErrorMessage = "El Rol Id es obligatorio.")]
        public int RoleId { get; set; }

        [Required(ErrorMessage = "El nombre del rol es obligatorio.")]
        [StringLength(100, ErrorMessage = "El nombre del rol no puede exceder los 100 caracteres.")]
        public string RoleName { get; set; }

        [StringLength(500, ErrorMessage = "La ruta de accesos no puede exceder los 500 caracteres.")]
        public string? MenuAccess { get; set; }

        [Required(ErrorMessage = "El estado del rol es obligatorio.")]
        public bool IsActive { get; set; }

        [NotMapped]
        public int? NewRoleId { get; set; }

        [NotMapped]
        public int? Success { get; set; }
    }
}