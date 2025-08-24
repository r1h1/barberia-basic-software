using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using BarberiaSoftwareAPIs.Data;
using BarberiaSoftwareAPIs.Models;

namespace BarberiaSoftwareAPIs.Controllers
{
    [Route("api/v1/[controller]")]
    [ApiController]
    public class RolesController : ControllerBase
    {
        private readonly RolesData _rolesData;

        public RolesController(RolesData rolesData)
        {
            _rolesData = rolesData;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllRoles()
        {
            try
            {
                var rolesList = await _rolesData.GetAllRoles();

                if (rolesList == null || !rolesList.Any())
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "No se encontraron roles.",
                        data = new List<Roles>()
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Roles obtenidos correctamente.",
                    data = rolesList
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al obtener los roles.",
                    error = ex.Message
                });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetRolById(int id)
        {
            try
            {
                var objeto = await _rolesData.GetRolById(id);

                if (objeto == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "No se encontró el rol.",
                        data = (object)null
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Rol obtenido correctamente.",
                    data = objeto
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al obtener el rol.",
                    error = ex.Message
                });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateRol([FromBody] Roles objeto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Datos inválidos.",
                    errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)
                });
            }

            try
            {
                objeto = await _rolesData.CreateRol(objeto);

                if (objeto.Success == 1)
                {
                    return StatusCode(201, new
                    {
                        success = true,
                        message = "Rol creado exitosamente.",
                        data = objeto
                    });
                }

                return BadRequest(new
                {
                    success = false,
                    message = "No se pudo crear el rol.",
                    data = objeto
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al crear el rol.",
                    error = ex.Message
                });
            }
        }

        [HttpPut]
        public async Task<IActionResult> UpdateRol([FromBody] Roles objeto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Datos inválidos.",
                    errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage)
                });
            }

            try
            {
                objeto = await _rolesData.UpdateRol(objeto);

                if (objeto.Success == 1)
                {
                    return Ok(new
                    {
                        success = true,
                        message = "Rol actualizado exitosamente.",
                        data = objeto
                    });
                }

                return BadRequest(new
                {
                    success = false,
                    message = "No se pudo actualizar el rol.",
                    data = objeto
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al actualizar el rol.",
                    error = ex.Message
                });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> SoftDeleteRol(int id)
        {
            try
            {
                var objeto = await _rolesData.SoftDeleteRol(id);

                if (objeto.Success == 1)
                {
                    return Ok(new
                    {
                        success = true,
                        message = "Rol eliminado exitosamente.",
                        data = objeto
                    });
                }

                return BadRequest(new
                {
                    success = false,
                    message = "No se pudo eliminar el rol.",
                    data = objeto
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al eliminar el rol.",
                    error = ex.Message
                });
            }
        }
    }
}