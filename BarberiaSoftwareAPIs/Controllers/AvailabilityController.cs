using Microsoft.AspNetCore.Mvc;
using BarberiaSoftwareAPIs.Data;
using BarberiaSoftwareAPIs.Models;

namespace BarberiaSoftwareAPIs.Controllers
{
    /// <summary>
    /// Controlador para gestión de disponibilidad y agendamiento de citas
    /// </summary>
    [Route("api/v1/[controller]")]
    [ApiController]
    public class AvailabilityController : ControllerBase
    {
        private readonly AvailabilityData _availabilityData;

        public AvailabilityController(AvailabilityData availabilityData)
        {
            _availabilityData = availabilityData;
        }

        /// <summary>
        /// Obtiene empleados disponibles con sus horarios para una fecha específica
        /// </summary>
        /// <param name="date">Fecha para consultar disponibilidad (formato: yyyy-MM-dd)</param>
        /// <returns>Lista de empleados con slots disponibles</returns>
        [HttpGet("EmployeesWithSlots")]
        public async Task<IActionResult> GetAvailableEmployeesWithSlots([FromQuery] DateTime date)
        {
            try
            {
                var employees = await _availabilityData.GetAvailableEmployeesWithSlots(date);

                if (employees == null || !employees.Any())
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "No hay empleados disponibles para la fecha especificada",
                        data = new List<AvailabilityModel>()
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Empleados y horarios obtenidos correctamente",
                    data = employees
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al obtener empleados disponibles",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Verifica la disponibilidad de un horario específico para un empleado
        /// </summary>
        /// <param name="request">Solicitud de verificación de disponibilidad</param>
        /// <returns>Estado de disponibilidad del horario</returns>
        [HttpPost("CheckAvailability")]
        public async Task<IActionResult> CheckAvailability([FromBody] AvailabilityCheckRequest request)
        {
            try
            {
                if (!ModelState.IsValid)
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = "Datos de solicitud inválidos",
                        errors = ModelState.Values.SelectMany(v => v.Errors)
                    });
                }

                var result = await _availabilityData.CheckEmployeeAvailability(
                    request.EmployeeId, request.Date, request.StartTime);

                return Ok(new
                {
                    success = result.Status == "Available",
                    status = result.Status,
                    message = result.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al verificar disponibilidad",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Obtiene las citas de un empleado para una fecha específica
        /// </summary>
        /// <param name="employeeId">ID del empleado</param>
        /// <param name="date">Fecha para consultar citas (formato: yyyy-MM-dd)</param>
        /// <returns>Lista de citas del empleado</returns>
        [HttpGet("EmployeeAppointments/{employeeId}")]
        public async Task<IActionResult> GetEmployeeAppointments(int employeeId, [FromQuery] DateTime date)
        {
            try
            {
                var appointments = await _availabilityData.GetEmployeeAppointments(employeeId, date);

                if (appointments == null || !appointments.Any())
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "No se encontraron citas para el empleado en la fecha especificada",
                        data = new List<Appointments>()
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Citas del empleado obtenidas correctamente",
                    data = appointments
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al obtener citas del empleado",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Obtiene todos los servicios disponibles
        /// </summary>
        /// <returns>Lista de servicios activos</returns>
        [HttpGet("Services")]
        public async Task<IActionResult> GetAllServices()
        {
            try
            {
                var services = await _availabilityData.GetAllServices();

                if (services == null || !services.Any())
                {
                    return NotFound(new
                    {
                        success = false,
                        message = "No se encontraron servicios disponibles",
                        data = new List<Services>()
                    });
                }

                return Ok(new
                {
                    success = true,
                    message = "Servicios obtenidos correctamente",
                    data = services
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al obtener servicios",
                    error = ex.Message
                });
            }
        }

        /// <summary>
        /// Endpoint para verificación rápida de disponibilidad vía GET
        /// </summary>
        [HttpGet("QuickAvailabilityCheck")]
        public async Task<IActionResult> QuickCheckAvailability(
            [FromQuery] int employeeId,
            [FromQuery] DateTime date,
            [FromQuery] TimeSpan startTime)
        {
            try
            {
                var result = await _availabilityData.CheckEmployeeAvailability(employeeId, date, startTime);

                return Ok(new
                {
                    success = result.Status == "Available",
                    status = result.Status,
                    message = result.Message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = "Error al verificar disponibilidad",
                    error = ex.Message
                });
            }
        }
    }
}