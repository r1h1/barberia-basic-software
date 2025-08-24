using BarberiaSoftwareAPIs.Data;
using BarberiaSoftwareAPIs.Models;
using Microsoft.AspNetCore.Mvc;

namespace BarberiaSoftwareAPIs.Controllers
{
    [Route("api/v1/[controller]")]
    [ApiController]
    public class ClientsController : ControllerBase
    {
        private readonly ClientsData _data;

        public ClientsController(ClientsData data)
        {
            _data = data;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] bool onlyActive = true)
        {
            try
            {
                var list = await _data.GetAllClients(onlyActive);

                if (list == null || !list.Any())
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "No se encontraron clientes.",
                        data = new List<Clients>()
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Clientes obtenidos correctamente.",
                    data = list
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al obtener los clientes.",
                    error = ex.Message
                });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var result = await _data.GetClientById(id);

                if (result == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Cliente no encontrado.",
                        data = (object?)null
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Cliente obtenido correctamente.",
                    data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al obtener el cliente.",
                    error = ex.Message
                });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Clients model)
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
                var (success, message) = await _data.CreateClient(model);

                if (success)
                {
                    return StatusCode(201, new
                    {
                        success = true,
                        message = message,
                        data = model
                    });
                }

                return BadRequest(new
                {
                    success = false,
                    message = message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al crear el cliente.",
                    error = ex.Message
                });
            }
        }

        [HttpPut]
        public async Task<IActionResult> Update([FromBody] Clients model)
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
                var (success, message) = await _data.UpdateClient(model);

                if (success)
                {
                    return Ok(new
                    {
                        success = true,
                        message = message,
                        data = model
                    });
                }

                return BadRequest(new
                {
                    success = false,
                    message = message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al actualizar el cliente.",
                    error = ex.Message
                });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var (success, message) = await _data.DeleteClient(id);

                if (success)
                {
                    return Ok(new
                    {
                        success = true,
                        message = message
                    });
                }

                return BadRequest(new
                {
                    success = false,
                    message = message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al eliminar el cliente.",
                    error = ex.Message
                });
            }
        }
    }
}