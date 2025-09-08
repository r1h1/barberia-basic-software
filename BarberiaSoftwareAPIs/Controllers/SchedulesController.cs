using Microsoft.AspNetCore.Mvc;
using BarberiaSoftwareAPIs.Data;
using BarberiaSoftwareAPIs.Models;

namespace BarberiaSoftwareAPIs.Controllers
{
    [Route("api/v1/[controller]")]
    [ApiController]
    public class SchedulesController : ControllerBase
    {
        private readonly SchedulesData _data;

        public SchedulesController(SchedulesData data)
        {
            _data = data;
        }

        // GET api/v1/Schedules/by-employee/5?onlyActive=true
        [HttpGet("by-employee/{employeeId}")]
        public async Task<IActionResult> GetByEmployee(int employeeId, [FromQuery] bool onlyActive = true)
        {
            try
            {
                var list = await _data.GetByEmployee(employeeId, onlyActive);

                if (list == null || !list.Any())
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "No se encontraron horarios para el empleado.",
                        data = new List<Schedules>()
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Horarios obtenidos correctamente.",
                    data = list
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al obtener los horarios por empleado.",
                    error = ex.Message
                });
            }
        }

        // GET api/v1/Schedules/by-day/1?onlyActive=true
        [HttpGet("by-day/{dayOfWeek}")]
        public async Task<IActionResult> GetByDay(byte dayOfWeek, [FromQuery] bool onlyActive = true)
        {
            try
            {
                var list = await _data.GetByDay(dayOfWeek, onlyActive);

                if (list == null || !list.Any())
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "No se encontraron horarios para ese día.",
                        data = new List<Schedules>()
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Horarios obtenidos correctamente.",
                    data = list
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al obtener los horarios por día.",
                    error = ex.Message
                });
            }
        }

        // GET api/v1/Schedules/10
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
                        message = "Horario no encontrado.",
                        data = (object?)null
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Horario obtenido correctamente.",
                    data = item
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al obtener el horario.",
                    error = ex.Message
                });
            }
        }

        // POST api/v1/Schedules
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Schedules model)
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

            if (model.StartTime >= model.EndTime)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "La hora de inicio debe ser menor a la hora de fin."
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
                        message = "Horario creado exitosamente.",
                        data = model
                    });
                }

                return BadRequest(new
                {
                    success = false,
                    message = model.Message ?? "No se pudo crear el horario.",
                    data = model
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al crear el horario.",
                    error = ex.Message
                });
            }
        }

        // PUT api/v1/Schedules
        [HttpPut]
        public async Task<IActionResult> Update([FromBody] Schedules model)
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
                        message = "Horario actualizado exitosamente.",
                        data = model
                    });
                }

                return BadRequest(new
                {
                    success = false,
                    message = model.Message ?? "No se pudo actualizar el horario.",
                    data = model
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al actualizar el horario.",
                    error = ex.Message
                });
            }
        }

        // DELETE api/v1/Schedules/10
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var result = await _data.DeleteSoft(id);

                if (result.Success == 1)
                {
                    return Ok(new
                    {
                        success = true,
                        message = result.Message
                    });
                }

                return BadRequest(new
                {
                    success = false,
                    message = result.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al eliminar el horario.",
                    error = ex.Message
                });
            }
        }
    }
}