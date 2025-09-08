using BarberiaSoftwareAPIs.Models;
using System.Data;
using System.Data.SqlClient;

namespace BarberiaSoftwareAPIs.Data
{
    public class AvailabilityData
    {
        private readonly string _connection;

        public AvailabilityData(IConfiguration configuration)
        {
            _connection = configuration.GetConnectionString("SQLConnection");
        }

        // Obtener empleados disponibles con slots
        public async Task<List<AvailabilityModel>> GetAvailableEmployeesWithSlots(DateTime date)
        {
            var list = new List<AvailabilityModel>();

            using var con = new SqlConnection(_connection);
            using var cmd = new SqlCommand("GetAvailableEmployees", con);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@Date", date.Date);

            await con.OpenAsync();
            using var reader = await cmd.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                list.Add(new AvailabilityModel
                {
                    EmployeeId = reader.GetInt32("EmployeeId"),
                    Name = reader.GetString("Name"),
                    Specialty = reader.IsDBNull("Specialty") ? null : reader.GetString("Specialty"),
                    AvailableSlots = reader.IsDBNull("AvailableSlots") ? null : reader.GetString("AvailableSlots")
                });
            }

            return list;
        }

        // Verificar disponibilidad específica
        public async Task<AvailabilityCheckResponse> CheckEmployeeAvailability(int employeeId, DateTime date, TimeSpan startTime)
        {
            using var con = new SqlConnection(_connection);
            using var cmd = new SqlCommand("CheckEmployeeAvailability", con);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@EmployeeId", employeeId);
            cmd.Parameters.AddWithValue("@Date", date.Date);
            cmd.Parameters.AddWithValue("@StartTime", startTime);

            await con.OpenAsync();
            using var reader = await cmd.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                return new AvailabilityCheckResponse
                {
                    Status = reader.GetString("Status"),
                    Message = reader.GetString("Message")
                };
            }

            return new AvailabilityCheckResponse
            {
                Status = "Error",
                Message = "No se pudo verificar la disponibilidad"
            };
        }

        // Obtener citas de un empleado
        public async Task<List<Appointments>> GetEmployeeAppointments(int employeeId, DateTime date)
        {
            var list = new List<Appointments>();

            using var con = new SqlConnection(_connection);
            using var cmd = new SqlCommand("GetEmployeeAppointments", con);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@EmployeeId", employeeId);
            cmd.Parameters.AddWithValue("@Date", date.Date);

            await con.OpenAsync();
            using var reader = await cmd.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                list.Add(new Appointments
                {
                    AppointmentId = reader.GetInt32("AppointmentId"),
                    ClientId = reader.GetInt32("ClientId"),
                    EmployeeId = employeeId,
                    Date = reader.GetDateTime("Date"),
                    StartTime = reader.GetTimeSpan(reader.GetOrdinal("StartTime")),
                    EndTime = reader.GetTimeSpan(reader.GetOrdinal("EndTime")),
                    Status = reader.GetString("Status"),
                    ClientName = reader.GetString("ClientName"),
                    ServiceName = reader.GetString("ServiceName")
                });
            }

            return list;
        }

        // Obtener todos los servicios
        public async Task<List<Services>> GetAllServices()
        {
            var list = new List<Services>();

            using var con = new SqlConnection(_connection);
            using var cmd = new SqlCommand("GetAllServices", con);
            cmd.CommandType = CommandType.StoredProcedure;

            await con.OpenAsync();
            using var reader = await cmd.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                list.Add(new Services
                {
                    ServiceId = reader.GetInt32("ServiceId"),
                    Name = reader.GetString("Name"),
                    Description = reader.IsDBNull("Description") ? null : reader.GetString("Description"),
                    BasePrice = reader.GetDecimal("BasePrice"),
                    DurationMin = reader.GetInt32("DurationMin")
                });
            }

            return list;
        }
    }
}