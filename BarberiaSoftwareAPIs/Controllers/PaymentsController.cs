using Microsoft.AspNetCore.Mvc;
using BarberiaSoftwareAPIs.Data;
using BarberiaSoftwareAPIs.Models;

namespace BarberiaSoftwareAPIs.Controllers
{
    [Route("api/v1/[controller]")]
    [ApiController]
    public class PaymentsController : ControllerBase
    {
        private readonly PaymentsData _data;

        public PaymentsController(PaymentsData data)
        {
            _data = data;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll(
            [FromQuery] int? appointmentId = null,
            [FromQuery] int? clientId = null,
            [FromQuery] string? paymentType = null,
            [FromQuery] string? status = null,
            [FromQuery] bool onlyActive = true)
        {
            try
            {
                var list = await _data.GetAll(appointmentId, clientId, paymentType, status, onlyActive);

                if (list == null || !list.Any())
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "No se encontraron pagos.",
                        data = new List<Payments>()
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Pagos obtenidos correctamente.",
                    data = list
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al obtener los pagos.",
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
                        message = "Pago no encontrado.",
                        data = (object?)null
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Pago obtenido correctamente.",
                    data = item
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al obtener el pago.",
                    error = ex.Message
                });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Payments model)
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
                        message = "Pago registrado exitosamente.",
                        data = model
                    });
                }

                return BadRequest(new
                {
                    success = false,
                    message = model.Message ?? "No se pudo registrar el pago.",
                    data = model
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al registrar el pago.",
                    error = ex.Message
                });
            }
        }

        [HttpPut]
        public async Task<IActionResult> Update([FromBody] Payments model)
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
                        message = "Pago actualizado exitosamente.",
                        data = model
                    });
                }

                return BadRequest(new
                {
                    success = false,
                    message = model.Message ?? "No se pudo actualizar el pago.",
                    data = model
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al actualizar el pago.",
                    error = ex.Message
                });
            }
        }

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
                    message = "Error al eliminar/anular el pago.",
                    error = ex.Message
                });
            }
        }
    }
}