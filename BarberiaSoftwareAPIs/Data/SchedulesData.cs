using BarberiaSoftwareAPIs.Models;
using System.Data;
using System.Data.SqlClient;

namespace BarberiaSoftwareAPIs.Data
{
    public class SchedulesData
    {
        private readonly string _connection;

        public SchedulesData(IConfiguration config)
        {
            _connection = config.GetConnectionString("SQLConnection")
                ?? throw new ArgumentNullException("SQLConnection");
        }

        // Lista por empleado
        public async Task<List<Schedules>> GetByEmployee(int employeeId, bool onlyActive = true)
        {
            var list = new List<Schedules>();

            await using var con = new SqlConnection(_connection);
            await con.OpenAsync();

            using var cmd = new SqlCommand("sch_ListByEmployee", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@EmployeeId", employeeId);
            cmd.Parameters.AddWithValue("@OnlyActive", onlyActive);

            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                list.Add(new Schedules
                {
                    ScheduleId = reader.GetInt32(reader.GetOrdinal("ScheduleId")),
                    EmployeeId = reader.GetInt32(reader.GetOrdinal("EmployeeId")),
                    DayOfWeek = reader.GetByte(reader.GetOrdinal("DayOfWeek")),
                    StartTime = reader.GetTimeSpan(reader.GetOrdinal("StartTime")),
                    EndTime = reader.GetTimeSpan(reader.GetOrdinal("EndTime")),
                    IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive"))
                });
            }

            return list;
        }

        // Lista por día
        public async Task<List<Schedules>> GetByDay(byte dayOfWeek, bool onlyActive = true)
        {
            var list = new List<Schedules>();

            await using var con = new SqlConnection(_connection);
            await con.OpenAsync();

            using var cmd = new SqlCommand("sch_ListByDay", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@DayOfWeek", dayOfWeek);
            cmd.Parameters.AddWithValue("@OnlyActive", onlyActive);

            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                list.Add(new Schedules
                {
                    ScheduleId = reader.GetInt32(reader.GetOrdinal("ScheduleId")),
                    EmployeeId = reader.GetInt32(reader.GetOrdinal("EmployeeId")),
                    DayOfWeek = reader.GetByte(reader.GetOrdinal("DayOfWeek")),
                    StartTime = reader.GetTimeSpan(reader.GetOrdinal("StartTime")),
                    EndTime = reader.GetTimeSpan(reader.GetOrdinal("EndTime")),
                    IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive"))
                });
            }

            return list;
        }

        // Obtener por ID
        public async Task<Schedules?> GetById(int id)
        {
            await using var con = new SqlConnection(_connection);
            await con.OpenAsync();

            using var cmd = new SqlCommand("sch_GetById", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@ScheduleId", id);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return new Schedules
                {
                    ScheduleId = reader.GetInt32(reader.GetOrdinal("ScheduleId")),
                    EmployeeId = reader.GetInt32(reader.GetOrdinal("EmployeeId")),
                    DayOfWeek = reader.GetByte(reader.GetOrdinal("DayOfWeek")),
                    StartTime = reader.GetTimeSpan(reader.GetOrdinal("StartTime")),
                    EndTime = reader.GetTimeSpan(reader.GetOrdinal("EndTime")),
                    IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive"))
                };
            }
            return null;
        }

        // Crear
        public async Task<Schedules> Create(Schedules s)
        {
            await using var con = new SqlConnection(_connection);
            await con.OpenAsync();

            using var cmd = new SqlCommand("sch_Create", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@EmployeeId", s.EmployeeId);
            cmd.Parameters.AddWithValue("@DayOfWeek", s.DayOfWeek);
            cmd.Parameters.AddWithValue("@StartTime", s.StartTime);
            cmd.Parameters.AddWithValue("@EndTime", s.EndTime);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                s.Success = reader.GetBoolean(reader.GetOrdinal("Success")) ? 1 : 0;
                s.Message = reader["Message"].ToString();
                if (s.Success == 1 && reader.FieldCount > 2)
                {
                    s.ScheduleId = reader.GetInt32(reader.GetOrdinal("ScheduleId"));
                    s.IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive"));
                }
            }
            return s;
        }

        // Actualizar
        public async Task<Schedules> Update(Schedules s)
        {
            await using var con = new SqlConnection(_connection);
            await con.OpenAsync();

            using var cmd = new SqlCommand("sch_Update", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@ScheduleId", s.ScheduleId);
            cmd.Parameters.AddWithValue("@DayOfWeek", s.DayOfWeek);
            cmd.Parameters.AddWithValue("@StartTime", s.StartTime);
            cmd.Parameters.AddWithValue("@EndTime", s.EndTime);
            cmd.Parameters.AddWithValue("@IsActive", s.IsActive);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                s.Success = reader.GetBoolean(reader.GetOrdinal("Success")) ? 1 : 0;
                s.Message = reader["Message"].ToString();
            }
            return s;
        }

        // Eliminación lógica
        public async Task<Schedules> DeleteSoft(int id)
        {
            var result = new Schedules { ScheduleId = id };

            await using var con = new SqlConnection(_connection);
            await con.OpenAsync();

            using var cmd = new SqlCommand("sch_DeleteSoft", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@ScheduleId", id);

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