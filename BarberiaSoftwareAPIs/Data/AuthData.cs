using BarberiaSoftwareAPIs.Models;
using System.Data;
using System.Data.SqlClient;

namespace BarberiaSoftwareAPIs.Data
{
    public class AuthData
    {
        private readonly string _connection;

        public AuthData(IConfiguration config)
        {
            _connection = config.GetConnectionString("SQLConnection")
                ?? throw new ArgumentNullException("SQLConnection");
        }

        public async Task<AuthResponse> Login(LoginRequest loginRequest)
        {
            var response = new AuthResponse();

            await using var con = new SqlConnection(_connection);
            await con.OpenAsync();

            using var cmd = new SqlCommand("sec_LoginBasic", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@Login", loginRequest.Login);
            cmd.Parameters.AddWithValue("@Password", loginRequest.Password);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                response.Success = reader.GetBoolean(reader.GetOrdinal("Success"));
                response.Message = reader["Message"].ToString();

                if (response.Success)
                {
                    response.AuthUserId = reader.GetInt32(reader.GetOrdinal("AuthUserId"));
                    response.Username = reader.GetString(reader.GetOrdinal("Username"));
                    response.RoleId = reader.GetInt32(reader.GetOrdinal("RoleId"));
                    response.RoleName = reader.GetString(reader.GetOrdinal("RoleName"));
                    response.MenuAccess = reader.IsDBNull("MenuAccess") ? null : reader.GetString(reader.GetOrdinal("MenuAccess"));
                    response.UserId = reader.IsDBNull("UserId") ? null : reader.GetInt32(reader.GetOrdinal("UserId"));
                    response.EmployeeId = reader.IsDBNull("EmployeeId") ? null : reader.GetInt32(reader.GetOrdinal("EmployeeId"));
                    response.PersonName = reader.GetString(reader.GetOrdinal("PersonName"));
                    response.Email = reader.IsDBNull("Email") ? null : reader.GetString(reader.GetOrdinal("Email"));
                    response.Phone = reader.IsDBNull("Phone") ? null : reader.GetString(reader.GetOrdinal("Phone"));
                    response.LastLogin = reader.IsDBNull("LastLogin") ? null : reader.GetDateTime(reader.GetOrdinal("LastLogin"));
                }
            }

            return response;
        }

        public async Task<AuthResponse> Register(RegisterRequest registerRequest)
        {
            var response = new AuthResponse();

            await using var con = new SqlConnection(_connection);
            await con.OpenAsync();

            using var cmd = new SqlCommand("sec_RegisterAuthUser", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@Username", registerRequest.Username);
            cmd.Parameters.AddWithValue("@Password", registerRequest.Password);
            cmd.Parameters.AddWithValue("@RoleId", registerRequest.RoleId);
            cmd.Parameters.AddWithValue("@UserId", registerRequest.UserId ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@EmployeeId", registerRequest.EmployeeId ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@IsActive", registerRequest.IsActive);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                response.Success = reader.GetBoolean(reader.GetOrdinal("Success"));
                response.Message = reader["Message"].ToString();

                if (response.Success)
                {
                    response.AuthUserId = reader.GetInt32(reader.GetOrdinal("AuthUserId"));
                    response.Username = reader.GetString(reader.GetOrdinal("Username"));
                    response.RoleId = reader.GetInt32(reader.GetOrdinal("RoleId"));
                    response.RoleName = reader.GetString(reader.GetOrdinal("RoleName"));
                    response.MenuAccess = reader.IsDBNull("MenuAccess") ? null : reader.GetString(reader.GetOrdinal("MenuAccess"));
                    response.UserId = reader.IsDBNull("UserId") ? null : reader.GetInt32(reader.GetOrdinal("UserId"));
                    response.EmployeeId = reader.IsDBNull("EmployeeId") ? null : reader.GetInt32(reader.GetOrdinal("EmployeeId"));
                    response.PersonName = reader.GetString(reader.GetOrdinal("PersonName"));
                    response.Email = reader.IsDBNull("Email") ? null : reader.GetString(reader.GetOrdinal("Email"));
                    response.Phone = reader.IsDBNull("Phone") ? null : reader.GetString(reader.GetOrdinal("Phone"));
                    response.IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive"));
                    response.CreatedAt = reader.GetDateTime(reader.GetOrdinal("CreatedAt"));
                    response.LastLogin = reader.IsDBNull("LastLogin") ? null : reader.GetDateTime(reader.GetOrdinal("LastLogin"));
                }
            }

            return response;
        }

        public async Task<AuthResponse> ChangePassword(ChangePasswordRequest changePasswordRequest)
        {
            var response = new AuthResponse();

            await using var con = new SqlConnection(_connection);
            await con.OpenAsync();

            using var cmd = new SqlCommand("sec_ChangePasswordBasic", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@AuthUserId", changePasswordRequest.AuthUserId ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@Username", changePasswordRequest.Username ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@CurrentPassword", changePasswordRequest.CurrentPassword);
            cmd.Parameters.AddWithValue("@NewPassword", changePasswordRequest.NewPassword);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                response.Success = reader.GetBoolean(reader.GetOrdinal("Success"));
                response.Message = reader["Message"].ToString();
            }

            return response;
        }

        public async Task<AuthResponse> UpdateAuthUser(UpdateAuthUserRequest updateRequest)
        {
            var response = new AuthResponse();

            await using var con = new SqlConnection(_connection);
            await con.OpenAsync();

            using var cmd = new SqlCommand("auth_Update", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@AuthUserId", updateRequest.AuthUserId);
            cmd.Parameters.AddWithValue("@Username", updateRequest.Username);
            cmd.Parameters.AddWithValue("@RoleId", updateRequest.RoleId);
            cmd.Parameters.AddWithValue("@UserId", updateRequest.UserId ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@EmployeeId", updateRequest.EmployeeId ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@IsActive", updateRequest.IsActive);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                response.Success = reader.GetBoolean(reader.GetOrdinal("Success"));
                response.Message = reader["Message"].ToString();
            }

            return response;
        }
    }
}