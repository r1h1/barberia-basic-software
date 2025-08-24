using Microsoft.AspNetCore.Mvc;
using BarberiaSoftwareAPIs.Data;
using BarberiaSoftwareAPIs.Models;

namespace BarberiaSoftwareAPIs.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class ServicesController : ControllerBase
    {
        private readonly ServicesData _data;

        public ServicesController(ServicesData data)
        {
            _data = data;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllServices([FromQuery] bool onlyActive = true)
        {
            try
            {
                var services = await _data.GetAllServices(onlyActive);

                if (services == null || !services.Any())
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "No se encontraron servicios.",
                        data = new List<Services>()
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Servicios obtenidos correctamente.",
                    data = services
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al obtener los servicios.",
                    error = ex.Message
                });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetServiceById(int id)
        {
            try
            {
                var service = await _data.GetServiceById(id);

                if (service == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Servicio no encontrado.",
                        data = (object?)null
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Servicio obtenido correctamente.",
                    data = service
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al obtener el servicio.",
                    error = ex.Message
                });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateService([FromBody] Services model)
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
                var result = await _data.CreateService(model);

                if (result.Success == true)
                {
                    return StatusCode(201, new
                    {
                        success = true,
                        message = result.Message,
                        data = result
                    });
                }

                return BadRequest(new
                {
                    success = false,
                    message = result.Message,
                    data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al crear el servicio.",
                    error = ex.Message
                });
            }
        }

        [HttpPut]
        public async Task<IActionResult> UpdateService([FromBody] Services model)
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
                var result = await _data.UpdateService(model);

                if (result.Success == true)
                {
                    return Ok(new
                    {
                        success = true,
                        message = result.Message,
                        data = result
                    });
                }

                return BadRequest(new
                {
                    success = false,
                    message = result.Message,
                    data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al actualizar el servicio.",
                    error = ex.Message
                });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> SoftDeleteService(int id)
        {
            try
            {
                var result = await _data.SoftDeleteService(id);

                if (result.Success == true)
                {
                    return Ok(new
                    {
                        success = true,
                        message = result.Message,
                        data = result
                    });
                }

                return BadRequest(new
                {
                    success = false,
                    message = result.Message,
                    data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al eliminar el servicio.",
                    error = ex.Message
                });
            }
        }
    }
}