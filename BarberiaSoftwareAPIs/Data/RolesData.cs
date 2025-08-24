using BarberiaSoftwareAPIs.Models;
using System.Data;
using System.Data.SqlClient;

namespace BarberiaSoftwareAPIs.Data
{
    public class RolesData
    {
        private readonly string _connection;

        public RolesData(IConfiguration configuration)
        {
            _connection = configuration.GetConnectionString("SQLConnection")
                ?? throw new ArgumentNullException("SQLConnection", "Cadena de conexión no configurada.");
        }

        public async Task<List<Roles>> GetAllRoles()
        {
            var rolesList = new List<Roles>();

            await using var con = new SqlConnection(_connection);
            await con.OpenAsync();

            using var cmd = new SqlCommand("role_GetAll", con) { CommandType = CommandType.StoredProcedure };
            using var reader = await cmd.ExecuteReaderAsync();

            while (await reader.ReadAsync())
            {
                rolesList.Add(new Roles
                {
                    RoleId = reader.GetInt32(0),
                    RoleName = reader.GetString(1),
                    MenuAccess = reader.IsDBNull(2) ? null : reader.GetString(2),
                    IsActive = reader.GetBoolean(3)
                });
            }

            return rolesList;
        }

        public async Task<Roles?> GetRolById(int roleId)
        {
            await using var con = new SqlConnection(_connection);
            await con.OpenAsync();

            using var cmd = new SqlCommand("role_GetById", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@RoleId", roleId);

            using var reader = await cmd.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                return new Roles
                {
                    RoleId = reader.GetInt32(0),
                    RoleName = reader.GetString(1),
                    MenuAccess = reader.IsDBNull(2) ? null : reader.GetString(2),
                    IsActive = reader.GetBoolean(3)
                };
            }

            return null;
        }

        public async Task<Roles> CreateRol(Roles objeto)
        {
            await using var con = new SqlConnection(_connection);
            using var cmd = new SqlCommand("role_Create", con) { CommandType = CommandType.StoredProcedure };

            cmd.Parameters.AddWithValue("@RoleName", objeto.RoleName);
            cmd.Parameters.AddWithValue("@MenuAccess", objeto.MenuAccess ?? (object)DBNull.Value);

            var paramId = new SqlParameter("@NewRoleId", SqlDbType.Int) { Direction = ParameterDirection.Output };
            var paramSuccess = new SqlParameter("@Success", SqlDbType.Bit) { Direction = ParameterDirection.Output };

            cmd.Parameters.Add(paramId);
            cmd.Parameters.Add(paramSuccess);

            try
            {
                await con.OpenAsync();
                await cmd.ExecuteNonQueryAsync();

                objeto.Success = Convert.ToBoolean(paramSuccess.Value) ? 1 : 0;
                objeto.NewRoleId = objeto.Success == 1 ? Convert.ToInt32(paramId.Value) : null;
            }
            catch
            {
                objeto.Success = 0;
                objeto.NewRoleId = null;
                throw;
            }

            return objeto;
        }

        public async Task<Roles> UpdateRol(Roles objeto)
        {
            await using var con = new SqlConnection(_connection);
            using var cmd = new SqlCommand("role_Update", con) { CommandType = CommandType.StoredProcedure };

            cmd.Parameters.AddWithValue("@RoleId", objeto.RoleId);
            cmd.Parameters.AddWithValue("@RoleName", objeto.RoleName);
            cmd.Parameters.AddWithValue("@MenuAccess", objeto.MenuAccess ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@IsActive", objeto.IsActive);

            var paramSuccess = new SqlParameter("@Success", SqlDbType.Bit) { Direction = ParameterDirection.Output };
            cmd.Parameters.Add(paramSuccess);

            try
            {
                await con.OpenAsync();
                await cmd.ExecuteNonQueryAsync();
                objeto.Success = Convert.ToBoolean(paramSuccess.Value) ? 1 : 0;
            }
            catch
            {
                objeto.Success = 0;
                throw;
            }

            return objeto;
        }

        public async Task<Roles> SoftDeleteRol(int roleId)
        {
            var objeto = new Roles { RoleId = roleId };

            await using var con = new SqlConnection(_connection);
            using var cmd = new SqlCommand("role_DeleteSoft", con) { CommandType = CommandType.StoredProcedure };

            cmd.Parameters.AddWithValue("@RoleId", roleId);

            var paramSuccess = new SqlParameter("@Success", SqlDbType.Bit) { Direction = ParameterDirection.Output };
            cmd.Parameters.Add(paramSuccess);

            try
            {
                await con.OpenAsync();
                await cmd.ExecuteNonQueryAsync();
                objeto.Success = Convert.ToBoolean(paramSuccess.Value) ? 1 : 0;
            }
            catch
            {
                objeto.Success = 0;
                throw;
            }

            return objeto;
        }
    }
}