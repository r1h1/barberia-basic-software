using BarberiaSoftwareAPIs.Models;
using System.Data;
using System.Data.SqlClient;

namespace BarberiaSoftwareAPIs.Data
{
    public class ServicesData
    {
        private readonly string _connection;

        public ServicesData(IConfiguration configuration)
        {
            _connection = configuration.GetConnectionString("SQLConnection");
        }

        // Obtener todos los servicios
        public async Task<List<Services>> GetAllServices(bool onlyActive = true)
        {
            List<Services> list = new();
            using var con = new SqlConnection(_connection);
            using var cmd = new SqlCommand("serv_List", con);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@OnlyActive", onlyActive);

            await con.OpenAsync();
            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                list.Add(new Services
                {
                    ServiceId = reader.GetInt32(reader.GetOrdinal("ServiceId")),
                    Name = reader.GetString(reader.GetOrdinal("Name")),
                    Description = reader.IsDBNull("Description") ? null : reader.GetString(reader.GetOrdinal("Description")),
                    BasePrice = reader.GetDecimal(reader.GetOrdinal("BasePrice")),
                    DurationMin = reader.GetInt32(reader.GetOrdinal("DurationMin")),
                    IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive"))
                });
            }
            return list;
        }

        // Obtener servicio por ID
        public async Task<Services?> GetServiceById(int id)
        {
            using var con = new SqlConnection(_connection);
            using var cmd = new SqlCommand("serv_GetById", con);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@ServiceId", id);

            await con.OpenAsync();
            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return new Services
                {
                    ServiceId = reader.GetInt32(reader.GetOrdinal("ServiceId")),
                    Name = reader.GetString(reader.GetOrdinal("Name")),
                    Description = reader.IsDBNull("Description") ? null : reader.GetString(reader.GetOrdinal("Description")),
                    BasePrice = reader.GetDecimal(reader.GetOrdinal("BasePrice")),
                    DurationMin = reader.GetInt32(reader.GetOrdinal("DurationMin")),
                    IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive"))
                };
            }
            return null;
        }

        // Crear servicio
        public async Task<Services> CreateService(Services model)
        {
            using var con = new SqlConnection(_connection);
            using var cmd = new SqlCommand("serv_Create", con);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@Name", model.Name);
            cmd.Parameters.AddWithValue("@Description", (object?)model.Description ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@BasePrice", model.BasePrice);
            cmd.Parameters.AddWithValue("@DurationMin", model.DurationMin);

            await con.OpenAsync();
            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return new Services
                {
                    Success = reader.GetBoolean(reader.GetOrdinal("Success")),
                    Message = reader.GetString(reader.GetOrdinal("Message")),
                    ServiceId = reader.GetInt32(reader.GetOrdinal("ServiceId")),
                    Name = reader.GetString(reader.GetOrdinal("Name")),
                    Description = reader.IsDBNull("Description") ? null : reader.GetString(reader.GetOrdinal("Description")),
                    BasePrice = reader.GetDecimal(reader.GetOrdinal("BasePrice")),
                    DurationMin = reader.GetInt32(reader.GetOrdinal("DurationMin")),
                    IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive"))
                };
            }

            return new Services { Success = false, Message = "Error al crear el servicio." };
        }

        // Actualizar servicio
        public async Task<Services> UpdateService(Services model)
        {
            using var con = new SqlConnection(_connection);
            using var cmd = new SqlCommand("serv_Update", con);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@ServiceId", model.ServiceId);
            cmd.Parameters.AddWithValue("@Name", model.Name);
            cmd.Parameters.AddWithValue("@Description", (object?)model.Description ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@BasePrice", model.BasePrice);
            cmd.Parameters.AddWithValue("@DurationMin", model.DurationMin);
            cmd.Parameters.AddWithValue("@IsActive", model.IsActive);

            await con.OpenAsync();
            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return new Services
                {
                    Success = reader.GetBoolean(reader.GetOrdinal("Success")),
                    Message = reader.GetString(reader.GetOrdinal("Message")),
                    ServiceId = reader.GetInt32(reader.GetOrdinal("ServiceId")),
                    Name = reader.GetString(reader.GetOrdinal("Name")),
                    Description = reader.IsDBNull("Description") ? null : reader.GetString(reader.GetOrdinal("Description")),
                    BasePrice = reader.GetDecimal(reader.GetOrdinal("BasePrice")),
                    DurationMin = reader.GetInt32(reader.GetOrdinal("DurationMin")),
                    IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive"))
                };
            }

            return new Services { Success = false, Message = "Error al actualizar el servicio." };
        }

        // Eliminación lógica
        public async Task<Services> SoftDeleteService(int id)
        {
            using var con = new SqlConnection(_connection);
            using var cmd = new SqlCommand("serv_DeleteSoft", con);
            cmd.CommandType = CommandType.StoredProcedure;
            cmd.Parameters.AddWithValue("@ServiceId", id);

            await con.OpenAsync();
            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return new Services
                {
                    Success = reader.GetBoolean(reader.GetOrdinal("Success")),
                    Message = reader.GetString(reader.GetOrdinal("Message"))
                };
            }

            return new Services { Success = false, Message = "Error al desactivar el servicio." };
        }
    }
}