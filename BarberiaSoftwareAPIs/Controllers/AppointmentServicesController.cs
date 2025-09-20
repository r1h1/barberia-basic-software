using BarberiaSoftwareAPIs.Data;
using BarberiaSoftwareAPIs.Models;
using Microsoft.AspNetCore.Mvc;

namespace BarberiaSoftwareAPIs.Controllers
{
    [Route("api/v1/[controller]")]
    [ApiController]
    public class AppointmentServicesController : ControllerBase
    {
        private readonly AppointmentServicesData _data;

        public AppointmentServicesController(AppointmentServicesData data)
        {
            _data = data;
        }

        [HttpGet("ByAppointment/{appointmentId}")]
        public async Task<IActionResult> GetByAppointment(int appointmentId)
        {
            try
            {
                var list = await _data.GetByAppointment(appointmentId);

                if (list == null || !list.Any())
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "No se encontraron servicios para esta cita.",
                        data = new List<AppointmentServices>()
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Servicios de cita obtenidos correctamente.",
                    data = list
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al obtener los servicios de la cita.",
                    error = ex.Message
                });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var item = await _data.GetById(id);

                if (item == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Servicio de cita no encontrado.",
                        data = (object)null
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Servicio de cita obtenido correctamente.",
                    data = item
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al obtener el servicio de la cita.",
                    error = ex.Message
                });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] AppointmentServices model)
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
                model = await _data.Create(model);

                if (model.Success == 1)
                {
                    return StatusCode(201, new
                    {
                        success = true,
                        message = "Servicio de cita creado exitosamente.",
                        data = model
                    });
                }

                return BadRequest(new
                {
                    success = false,
                    message = "No se pudo crear el servicio de la cita.",
                    data = model
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al crear el servicio de la cita.",
                    error = ex.Message
                });
            }
        }

        [HttpPut]
        public async Task<IActionResult> Update([FromBody] AppointmentServices model)
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
                model = await _data.Update(model);

                if (model.Success == 1)
                {
                    return Ok(new
                    {
                        success = true,
                        message = "Servicio de cita actualizado exitosamente.",
                        data = model
                    });
                }

                return BadRequest(new
                {
                    success = false,
                    message = "No se pudo actualizar el servicio de la cita.",
                    data = model
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al actualizar el servicio de la cita.",
                    error = ex.Message
                });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> SoftDelete(int id)
        {
            try
            {
                var result = await _data.DeleteSoft(id);

                if (result.Success == 1)
                {
                    return Ok(new
                    {
                        success = true,
                        message = "Servicio de cita eliminado exitosamente.",
                        data = result
                    });
                }

                return BadRequest(new
                {
                    success = false,
                    message = "No se pudo eliminar el servicio de la cita.",
                    data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al eliminar el servicio de la cita.",
                    error = ex.Message
                });
            }
        }
    }
}