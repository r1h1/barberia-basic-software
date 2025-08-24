using BarberiaSoftwareAPIs.Models;
using System.Data;
using System.Data.SqlClient;

namespace BarberiaSoftwareAPIs.Data
{
    public class AppointmentsData
    {
        private readonly string _connection;

        public AppointmentsData(IConfiguration config)
        {
            _connection = config.GetConnectionString("SQLConnection")
                ?? throw new ArgumentNullException("SQLConnection");
        }

        public async Task<List<Appointments>> GetAllAppointments(int? employeeId = null, int? clientId = null, string? status = null, bool onlyActive = true)
        {
            var list = new List<Appointments>();

            await using var con = new SqlConnection(_connection);
            await con.OpenAsync();

            using var cmd = new SqlCommand("appt_List", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@EmployeeId", (object?)employeeId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@ClientId", (object?)clientId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Status", (object?)status ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@OnlyActive", onlyActive);

            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                list.Add(new Appointments
                {
                    AppointmentId = reader.GetInt32(reader.GetOrdinal("AppointmentId")),
                    ClientId = reader.GetInt32(reader.GetOrdinal("ClientId")),
                    EmployeeId = reader.GetInt32(reader.GetOrdinal("EmployeeId")),
                    Date = reader.GetDateTime(reader.GetOrdinal("Date")),
                    StartTime = reader.GetTimeSpan(reader.GetOrdinal("StartTime")),
                    EndTime = reader.GetTimeSpan(reader.GetOrdinal("EndTime")),
                    Notes = reader.IsDBNull("Notes") ? null : reader.GetString(reader.GetOrdinal("Notes")),
                    Status = reader.GetString(reader.GetOrdinal("Status")),
                    IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive")),
                    ClientName = reader.IsDBNull("ClientName") ? null : reader.GetString(reader.GetOrdinal("ClientName")),
                    EmployeeName = reader.IsDBNull("EmployeeName") ? null : reader.GetString(reader.GetOrdinal("EmployeeName"))
                });
            }

            return list;
        }

        public async Task<Appointments?> GetAppointmentById(int id)
        {
            await using var con = new SqlConnection(_connection);
            await con.OpenAsync();

            using var cmd = new SqlCommand("appt_GetById", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@AppointmentId", id);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return new Appointments
                {
                    AppointmentId = reader.GetInt32(reader.GetOrdinal("AppointmentId")),
                    ClientId = reader.GetInt32(reader.GetOrdinal("ClientId")),
                    EmployeeId = reader.GetInt32(reader.GetOrdinal("EmployeeId")),
                    Date = reader.GetDateTime(reader.GetOrdinal("Date")),
                    StartTime = reader.GetTimeSpan(reader.GetOrdinal("StartTime")),
                    EndTime = reader.GetTimeSpan(reader.GetOrdinal("EndTime")),
                    Notes = reader.IsDBNull("Notes") ? null : reader.GetString(reader.GetOrdinal("Notes")),
                    Status = reader.GetString(reader.GetOrdinal("Status")),
                    IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive")),
                    ClientName = reader.IsDBNull("ClientName") ? null : reader.GetString(reader.GetOrdinal("ClientName")),
                    EmployeeName = reader.IsDBNull("EmployeeName") ? null : reader.GetString(reader.GetOrdinal("EmployeeName"))
                };
            }
            return null;
        }

        public async Task<Appointments> CreateAppointment(Appointments a)
        {
            await using var con = new SqlConnection(_connection);
            await con.OpenAsync();

            using var cmd = new SqlCommand("appt_Create", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@ClientId", a.ClientId);
            cmd.Parameters.AddWithValue("@EmployeeId", a.EmployeeId);
            cmd.Parameters.AddWithValue("@Date", a.Date);
            cmd.Parameters.AddWithValue("@StartTime", a.StartTime);
            cmd.Parameters.AddWithValue("@EndTime", a.EndTime);
            cmd.Parameters.AddWithValue("@Notes", a.Notes ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Status", a.Status ?? (object)DBNull.Value);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                a.Success = reader.GetBoolean(reader.GetOrdinal("Success")) ? 1 : 0;
                a.Message = reader["Message"].ToString();
                if (a.Success == 1 && reader.FieldCount > 2)
                {
                    a.AppointmentId = reader.GetInt32(reader.GetOrdinal("AppointmentId"));
                    a.Date = reader.GetDateTime(reader.GetOrdinal("Date"));
                    a.StartTime = reader.GetTimeSpan(reader.GetOrdinal("StartTime"));
                    a.EndTime = reader.GetTimeSpan(reader.GetOrdinal("EndTime"));
                    a.IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive"));
                }
            }
            return a;
        }

        public async Task<Appointments> UpdateAppointment(Appointments a)
        {
            await using var con = new SqlConnection(_connection);
            await con.OpenAsync();

            using var cmd = new SqlCommand("appt_Update", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@AppointmentId", a.AppointmentId);
            cmd.Parameters.AddWithValue("@ClientId", a.ClientId);
            cmd.Parameters.AddWithValue("@EmployeeId", a.EmployeeId);
            cmd.Parameters.AddWithValue("@Date", a.Date);
            cmd.Parameters.AddWithValue("@StartTime", a.StartTime);
            cmd.Parameters.AddWithValue("@EndTime", a.EndTime);
            cmd.Parameters.AddWithValue("@Notes", a.Notes ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Status", a.Status);
            cmd.Parameters.AddWithValue("@IsActive", a.IsActive);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                a.Success = reader.GetBoolean(reader.GetOrdinal("Success")) ? 1 : 0;
                a.Message = reader["Message"].ToString();
            }
            return a;
        }

        public async Task<Appointments> DeleteSoftAppointment(int id)
        {
            var result = new Appointments { AppointmentId = id };

            await using var con = new SqlConnection(_connection);
            await con.OpenAsync();

            using var cmd = new SqlCommand("appt_DeleteSoft", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@AppointmentId", id);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                result.Success = reader.GetBoolean(reader.GetOrdinal("Success")) ? 1 : 0;
                result.Message = reader["Message"].ToString();
            }
            return result;
        }
    }
}