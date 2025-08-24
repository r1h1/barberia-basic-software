using Microsoft.AspNetCore.Mvc;
using BarberiaSoftwareAPIs.Data;
using BarberiaSoftwareAPIs.Models;

namespace BarberiaSoftwareAPIs.Controllers
{
    [Route("api/v1/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly UsersData _data;

        public UsersController(UsersData data)
        {
            _data = data;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllUsers([FromQuery] bool onlyActive = true)
        {
            try
            {
                var users = await _data.GetAllUsers(onlyActive);

                if (users == null || !users.Any())
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "No se encontraron usuarios.",
                        data = new List<Users>()
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Usuarios obtenidos correctamente.",
                    data = users
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al obtener los usuarios.",
                    error = ex.Message
                });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetUserById(int id)
        {
            try
            {
                var user = await _data.GetUserById(id);

                if (user == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "No se encontró el usuario.",
                        data = (object?)null
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Usuario obtenido correctamente.",
                    data = user
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al obtener el usuario.",
                    error = ex.Message
                });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateUser([FromBody] Users model)
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
                model = await _data.CreateUser(model);

                if (model.Success == 1)
                {
                    return StatusCode(201, new
                    {
                        success = true,
                        message = "Usuario creado exitosamente.",
                        data = model
                    });
                }

                return BadRequest(new
                {
                    success = false,
                    message = "No se pudo crear el usuario.",
                    data = model
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al crear el usuario.",
                    error = ex.Message
                });
            }
        }

        [HttpPut]
        public async Task<IActionResult> UpdateUser([FromBody] Users model)
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
                model = await _data.UpdateUser(model);

                if (model.Success == 1)
                {
                    return Ok(new
                    {
                        success = true,
                        message = "Usuario actualizado exitosamente.",
                        data = model
                    });
                }

                return BadRequest(new
                {
                    success = false,
                    message = "No se pudo actualizar el usuario.",
                    data = model
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al actualizar el usuario.",
                    error = ex.Message
                });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            try
            {
                var result = await _data.DeleteUser(id);

                if (result.Success == 1)
                {
                    return Ok(new
                    {
                        success = true,
                        message = "Usuario eliminado exitosamente.",
                        data = result
                    });
                }

                return BadRequest(new
                {
                    success = false,
                    message = "No se pudo eliminar el usuario.",
                    data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al eliminar el usuario.",
                    error = ex.Message
                });
            }
        }
    }
}