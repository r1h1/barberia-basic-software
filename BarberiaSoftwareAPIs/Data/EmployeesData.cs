using BarberiaSoftwareAPIs.Models;
using System.Data;
using System.Data.SqlClient;

namespace BarberiaSoftwareAPIs.Data
{
    public class EmployeesData
    {
        private readonly string connection;

        public EmployeesData(IConfiguration configuration)
        {
            connection = configuration.GetConnectionString("SQLConnection");
        }

        public async Task<List<Employees>> GetAllEmployees(bool onlyActive = true)
        {
            List<Employees> employees = new();

            using (SqlConnection con = new(connection))
            {
                await con.OpenAsync();
                SqlCommand cmd = new("emp_List", con)
                {
                    CommandType = CommandType.StoredProcedure
                };
                cmd.Parameters.AddWithValue("@OnlyActive", onlyActive);

                using var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                {
                    employees.Add(new Employees
                    {
                        EmployeeId = reader.GetInt32(reader.GetOrdinal("EmployeeId")),
                        Name = reader.GetString(reader.GetOrdinal("Name")),
                        Email = reader.IsDBNull("Email") ? null : reader.GetString("Email"),
                        Phone = reader.IsDBNull("Phone") ? null : reader.GetString("Phone"),
                        CUI = reader.IsDBNull("CUI") ? null : reader.GetString("CUI"),
                        Specialty = reader.IsDBNull("Specialty") ? null : reader.GetString("Specialty"),
                        IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive"))
                    });
                }
            }
            return employees;
        }

        public async Task<Employees?> GetEmployeeById(int employeeId)
        {
            using SqlConnection con = new(connection);
            await con.OpenAsync();

            SqlCommand cmd = new("emp_GetById", con)
            {
                CommandType = CommandType.StoredProcedure
            };
            cmd.Parameters.AddWithValue("@EmployeeId", employeeId);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return new Employees
                {
                    EmployeeId = reader.GetInt32(reader.GetOrdinal("EmployeeId")),
                    Name = reader.GetString(reader.GetOrdinal("Name")),
                    Email = reader.IsDBNull("Email") ? null : reader.GetString("Email"),
                    Phone = reader.IsDBNull("Phone") ? null : reader.GetString("Phone"),
                    CUI = reader.IsDBNull("CUI") ? null : reader.GetString("CUI"),
                    Specialty = reader.IsDBNull("Specialty") ? null : reader.GetString("Specialty"),
                    IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive"))
                };
            }

            return null;
        }

        public async Task<(bool Success, string Message)> CreateEmployee(Employees model)
        {
            using SqlConnection con = new(connection);
            await con.OpenAsync();

            SqlCommand cmd = new("emp_Create", con)
            {
                CommandType = CommandType.StoredProcedure
            };
            cmd.Parameters.AddWithValue("@Name", model.Name);
            cmd.Parameters.AddWithValue("@Email", (object?)model.Email ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Phone", (object?)model.Phone ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@CUI", (object?)model.CUI ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Specialty", (object?)model.Specialty ?? DBNull.Value);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
                return (reader.GetBoolean(0), reader.GetString(1));

            return (false, "Error desconocido.");
        }

        public async Task<(bool Success, string Message)> UpdateEmployee(Employees model)
        {
            using SqlConnection con = new(connection);
            await con.OpenAsync();

            SqlCommand cmd = new("emp_Update", con)
            {
                CommandType = CommandType.StoredProcedure
            };
            cmd.Parameters.AddWithValue("@EmployeeId", model.EmployeeId);
            cmd.Parameters.AddWithValue("@Name", model.Name);
            cmd.Parameters.AddWithValue("@Email", (object?)model.Email ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Phone", (object?)model.Phone ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@CUI", (object?)model.CUI ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Specialty", (object?)model.Specialty ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@IsActive", model.IsActive);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
                return (reader.GetBoolean(0), reader.GetString(1));

            return (false, "Error desconocido.");
        }

        public async Task<(bool Success, string Message)> DeleteEmployee(int employeeId)
        {
            using SqlConnection con = new(connection);
            await con.OpenAsync();

            SqlCommand cmd = new("emp_DeleteSoft", con)
            {
                CommandType = CommandType.StoredProcedure
            };
            cmd.Parameters.AddWithValue("@EmployeeId", employeeId);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
                return (reader.GetBoolean(0), reader.GetString(1));

            return (false, "Error desconocido.");
        }
    }
}
