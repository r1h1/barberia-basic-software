using BarberiaSoftwareAPIs.Models;
using System.Data;
using System.Data.SqlClient;

namespace BarberiaSoftwareAPIs.Data
{
    public class ClientsData
    {
        private readonly string connection;

        public ClientsData(IConfiguration configuration)
        {
            connection = configuration.GetConnectionString("SQLConnection");
        }

        public async Task<List<Clients>> GetAllClients(bool onlyActive = true)
        {
            List<Clients> clients = new();

            using (SqlConnection con = new(connection))
            {
                await con.OpenAsync();
                SqlCommand cmd = new("cli_List", con)
                {
                    CommandType = CommandType.StoredProcedure
                };
                cmd.Parameters.AddWithValue("@OnlyActive", onlyActive);

                using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    clients.Add(new Clients
                    {
                        ClientId = reader.GetInt32(reader.GetOrdinal("ClientId")),
                        Name = reader.GetString(reader.GetOrdinal("Name")),
                        Phone = reader.IsDBNull("Phone") ? null : reader.GetString("Phone"),
                        Email = reader.IsDBNull("Email") ? null : reader.GetString("Email"),
                        Gender = reader.IsDBNull("Gender") ? null : reader.GetString("Gender"),
                        RegistrationDate = reader.GetDateTime(reader.GetOrdinal("RegistrationDate")),
                        IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive"))
                    });
                }
            }
            return clients;
        }

        public async Task<Clients?> GetClientById(int clientId)
        {
            using SqlConnection con = new(connection);
            await con.OpenAsync();

            SqlCommand cmd = new("cli_GetById", con)
            {
                CommandType = CommandType.StoredProcedure
            };
            cmd.Parameters.AddWithValue("@ClientId", clientId);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return new Clients
                {
                    ClientId = reader.GetInt32(reader.GetOrdinal("ClientId")),
                    Name = reader.GetString(reader.GetOrdinal("Name")),
                    Phone = reader.IsDBNull("Phone") ? null : reader.GetString("Phone"),
                    Email = reader.IsDBNull("Email") ? null : reader.GetString("Email"),
                    Gender = reader.IsDBNull("Gender") ? null : reader.GetString("Gender"),
                    RegistrationDate = reader.GetDateTime(reader.GetOrdinal("RegistrationDate")),
                    IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive"))
                };
            }

            return null;
        }

        public async Task<(bool Success, string Message)> CreateClient(Clients model)
        {
            using SqlConnection con = new(connection);
            await con.OpenAsync();

            SqlCommand cmd = new("cli_Create", con)
            {
                CommandType = CommandType.StoredProcedure
            };
            cmd.Parameters.AddWithValue("@Name", model.Name);
            cmd.Parameters.AddWithValue("@Phone", (object?)model.Phone ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Email", (object?)model.Email ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Gender", (object?)model.Gender ?? DBNull.Value);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
                return (reader.GetBoolean(0), reader.GetString(1));

            return (false, "Error desconocido.");
        }

        public async Task<(bool Success, string Message)> UpdateClient(Clients model)
        {
            using SqlConnection con = new(connection);
            await con.OpenAsync();

            SqlCommand cmd = new("cli_Update", con)
            {
                CommandType = CommandType.StoredProcedure
            };
            cmd.Parameters.AddWithValue("@ClientId", model.ClientId);
            cmd.Parameters.AddWithValue("@Name", model.Name);
            cmd.Parameters.AddWithValue("@Phone", (object?)model.Phone ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Email", (object?)model.Email ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Gender", (object?)model.Gender ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@IsActive", model.IsActive);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
                return (reader.GetBoolean(0), reader.GetString(1));

            return (false, "Error desconocido.");
        }

        public async Task<(bool Success, string Message)> DeleteClient(int clientId)
        {
            using SqlConnection con = new(connection);
            await con.OpenAsync();

            SqlCommand cmd = new("cli_DeleteSoft", con)
            {
                CommandType = CommandType.StoredProcedure
            };
            cmd.Parameters.AddWithValue("@ClientId", clientId);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
                return (reader.GetBoolean(0), reader.GetString(1));

            return (false, "Error desconocido.");
        }
    }
}