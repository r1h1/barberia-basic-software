using Microsoft.AspNetCore.Mvc;
using BarberiaSoftwareAPIs.Data;
using BarberiaSoftwareAPIs.Models;

namespace BarberiaSoftwareAPIs.Controllers
{
    [Route("api/v1/[controller]")]
    [ApiController]
    public class AppointmentsController : ControllerBase
    {
        private readonly AppointmentsData _data;

        public AppointmentsController(AppointmentsData data)
        {
            _data = data;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] int? employeeId = null, [FromQuery] int? clientId = null, [FromQuery] string? status = null, [FromQuery] bool onlyActive = true)
        {
            try
            {
                var list = await _data.GetAllAppointments(employeeId, clientId, status, onlyActive);

                if (list == null || !list.Any())
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "No se encontraron citas.",
                        data = new List<Appointments>()
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Citas obtenidas correctamente.",
                    data = list
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al obtener las citas.",
                    error = ex.Message
                });
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            try
            {
                var item = await _data.GetAppointmentById(id);
                if (item == null)
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "Cita no encontrada.",
                        data = (object?)null
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Cita obtenida correctamente.",
                    data = item
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al obtener la cita.",
                    error = ex.Message
                });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Appointments model)
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
                model = await _data.CreateAppointment(model);

                if (model.Success == 1)
                {
                    return StatusCode(201, new
                    {
                        success = true,
                        message = "Cita creada exitosamente.",
                        data = model
                    });
                }

                return BadRequest(new
                {
                    success = false,
                    message = model.Message ?? "No se pudo crear la cita.",
                    data = model
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al crear la cita.",
                    error = ex.Message
                });
            }
        }

        [HttpPut]
        public async Task<IActionResult> Update([FromBody] Appointments model)
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
                model = await _data.UpdateAppointment(model);

                if (model.Success == 1)
                {
                    return Ok(new
                    {
                        success = true,
                        message = "Cita actualizada exitosamente.",
                        data = model
                    });
                }

                return BadRequest(new
                {
                    success = false,
                    message = model.Message ?? "No se pudo actualizar la cita.",
                    data = model
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al actualizar la cita.",
                    error = ex.Message
                });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var result = await _data.DeleteSoftAppointment(id);

                if (result.Success == 1)
                {
                    return Ok(new
                    {
                        success = true,
                        message = result.Message ?? "Cita cancelada exitosamente.",
                        data = result
                    });
                }

                return BadRequest(new
                {
                    success = false,
                    message = result.Message ?? "No se pudo cancelar la cita.",
                    data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al cancelar la cita.",
                    error = ex.Message
                });
            }
        }
    }
}