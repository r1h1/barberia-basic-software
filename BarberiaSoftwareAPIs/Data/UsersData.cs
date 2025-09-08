using BarberiaSoftwareAPIs.Models;
using System.Data;
using System.Data.SqlClient;

namespace BarberiaSoftwareAPIs.Data
{
    public class UsersData
    {
        private readonly string connection;

        public UsersData(IConfiguration configuration)
        {
            connection = configuration.GetConnectionString("SQLConnection");
        }

        public async Task<List<Users>> GetAllUsers(bool onlyActive = true)
        {
            List<Users> users = new();

            using SqlConnection con = new(connection);
            await con.OpenAsync();

            SqlCommand cmd = new("usr_List", con)
            {
                CommandType = CommandType.StoredProcedure
            };
            cmd.Parameters.AddWithValue("@OnlyActive", onlyActive);

            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                users.Add(new Users
                {
                    UserId = reader.GetInt32("UserId"),
                    Name = reader.GetString("Name"),
                    Email = reader.GetString("Email"),
                    Phone = reader.GetString("Phone"),
                    Role = reader.GetString("Role"),
                    IsActive = reader.GetBoolean("IsActive")
                });
            }

            return users;
        }

        public async Task<Users?> GetUserById(int userId)
        {
            using SqlConnection con = new(connection);
            await con.OpenAsync();

            SqlCommand cmd = new("usr_GetById", con)
            {
                CommandType = CommandType.StoredProcedure
            };
            cmd.Parameters.AddWithValue("@UserId", userId);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return new Users
                {
                    UserId = reader.GetInt32("UserId"),
                    Name = reader.GetString("Name"),
                    Email = reader.GetString("Email"),
                    Phone = reader.GetString("Phone"),
                    Role = reader.GetString("Role"),
                    IsActive = reader.GetBoolean("IsActive")
                };
            }

            return null;
        }

        public async Task<Users> CreateUser(Users model)
        {
            using SqlConnection con = new(connection);
            await con.OpenAsync();

            SqlCommand cmd = new("usr_Create", con)
            {
                CommandType = CommandType.StoredProcedure
            };
            cmd.Parameters.AddWithValue("@Name", model.Name);
            cmd.Parameters.AddWithValue("@Email", model.Email);
            cmd.Parameters.AddWithValue("@Phone", model.Phone);
            cmd.Parameters.AddWithValue("@Role", model.Role);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                model.Success = reader.GetBoolean(0) ? 1 : 0;
                model.Message = reader.GetString(1);
            }

            return model;
        }

        public async Task<Users> UpdateUser(Users model)
        {
            using SqlConnection con = new(connection);
            await con.OpenAsync();

            SqlCommand cmd = new("usr_Update", con)
            {
                CommandType = CommandType.StoredProcedure
            };
            cmd.Parameters.AddWithValue("@UserId", model.UserId);
            cmd.Parameters.AddWithValue("@Name", model.Name);
            cmd.Parameters.AddWithValue("@Email", model.Email);
            cmd.Parameters.AddWithValue("@Phone", model.Phone);
            cmd.Parameters.AddWithValue("@Role", model.Role);
            cmd.Parameters.AddWithValue("@IsActive", model.IsActive);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                model.Success = reader.GetBoolean(0) ? 1 : 0;
                model.Message = reader.GetString(1);
            }

            return model;
        }

        public async Task<Users> DeleteUser(int userId)
        {
            Users result = new();

            using SqlConnection con = new(connection);
            await con.OpenAsync();

            SqlCommand cmd = new("usr_DeleteSoft", con)
            {
                CommandType = CommandType.StoredProcedure
            };
            cmd.Parameters.AddWithValue("@UserId", userId);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                result.Success = reader.GetBoolean(0) ? 1 : 0;
                result.Message = reader.GetString(1);
            }

            return result;
        }
    }
}