using Microsoft.AspNetCore.Mvc;
using BarberiaSoftwareAPIs.Data;
using BarberiaSoftwareAPIs.Models;

namespace BarberiaSoftwareAPIs.Controllers
{
    [Route("api/v1/[controller]")]
    [ApiController]
    public class AnnouncementsController : ControllerBase
    {
        private readonly AnnouncementsData _data;

        public AnnouncementsController(AnnouncementsData data)
        {
            _data = data;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] bool onlyActive = true)
        {
            try
            {
                var list = await _data.GetAll(onlyActive);

                if (list == null || !list.Any())
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "No se encontraron anuncios.",
                        data = new List<Announcements>()
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Anuncios obtenidos correctamente.",
                    data = list
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al obtener los anuncios.",
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
                        message = "Anuncio no encontrado.",
                        data = (object?)null
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Anuncio obtenido correctamente.",
                    data = item
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al obtener el anuncio.",
                    error = ex.Message
                });
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Announcements model)
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
                var result = await _data.Create(model);

                if (result.Success == 1)
                {
                    return CreatedAtAction(nameof(GetById), new { id = result.AnnouncementId }, new
                    {
                        success = true,
                        message = result.Message,
                        data = result
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
                    message = "Error al crear el anuncio.",
                    error = ex.Message
                });
            }
        }

        [HttpPut]
        public async Task<IActionResult> Update([FromBody] Announcements model)
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
                var result = await _data.Update(model);

                if (result.Success == 1)
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
                    message = result.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al actualizar el anuncio.",
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
                    message = "Error al eliminar el anuncio.",
                    error = ex.Message
                });
            }
        }
    }
}