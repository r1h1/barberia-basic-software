using BarberiaSoftwareAPIs.Models;
using System.Data;
using System.Data.SqlClient;

namespace BarberiaSoftwareAPIs.Data
{
    public class PaymentsData
    {
        private readonly string _connection;

        public PaymentsData(IConfiguration config)
        {
            _connection = config.GetConnectionString("SQLConnection")
                ?? throw new ArgumentNullException("SQLConnection");
        }

        public async Task<List<Payments>> GetAll(int? appointmentId = null, int? clientId = null, string? paymentType = null, string? status = null, bool onlyActive = true)
        {
            var list = new List<Payments>();

            await using var con = new SqlConnection(_connection);
            await con.OpenAsync();

            using var cmd = new SqlCommand("pay_List", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@AppointmentId", (object?)appointmentId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@ClientId", (object?)clientId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@PaymentType", (object?)paymentType ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@Status", (object?)status ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@OnlyActive", onlyActive);

            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                list.Add(new Payments
                {
                    PaymentId = reader.GetInt32(reader.GetOrdinal("PaymentId")),
                    AppointmentId = reader.GetInt32(reader.GetOrdinal("AppointmentId")),
                    ClientId = reader.GetInt32(reader.GetOrdinal("ClientId")),
                    PaymentType = reader.GetString(reader.GetOrdinal("PaymentType")),
                    AuthorizationNumber = reader.IsDBNull("AuthorizationNumber") ? null : reader.GetString(reader.GetOrdinal("AuthorizationNumber")),
                    TransactionNumber = reader.IsDBNull("TransactionNumber") ? null : reader.GetString(reader.GetOrdinal("TransactionNumber")),
                    TotalAmount = reader.GetDecimal(reader.GetOrdinal("TotalAmount")),
                    PaymentDate = reader.GetDateTime(reader.GetOrdinal("PaymentDate")),
                    Status = reader.IsDBNull("Status") ? null : reader.GetString(reader.GetOrdinal("Status")),
                    IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive")),
                    AppointmentDate = reader.GetDateTime(reader.GetOrdinal("Date")),
                    StartTime = reader.GetTimeSpan(reader.GetOrdinal("StartTime")),
                    EndTime = reader.GetTimeSpan(reader.GetOrdinal("EndTime")),
                    AppointmentStatus = reader.GetString(reader.GetOrdinal("AppointmentStatus")),
                    ClientName = reader.GetString(reader.GetOrdinal("ClientName"))
                });
            }

            return list;
        }

        public async Task<Payments?> GetById(int id)
        {
            await using var con = new SqlConnection(_connection);
            await con.OpenAsync();

            using var cmd = new SqlCommand("pay_GetById", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@PaymentId", id);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return new Payments
                {
                    PaymentId = reader.GetInt32(reader.GetOrdinal("PaymentId")),
                    AppointmentId = reader.GetInt32(reader.GetOrdinal("AppointmentId")),
                    ClientId = reader.GetInt32(reader.GetOrdinal("ClientId")),
                    PaymentType = reader.GetString(reader.GetOrdinal("PaymentType")),
                    AuthorizationNumber = reader.IsDBNull("AuthorizationNumber") ? null : reader.GetString(reader.GetOrdinal("AuthorizationNumber")),
                    TransactionNumber = reader.IsDBNull("TransactionNumber") ? null : reader.GetString(reader.GetOrdinal("TransactionNumber")),
                    TotalAmount = reader.GetDecimal(reader.GetOrdinal("TotalAmount")),
                    PaymentDate = reader.GetDateTime(reader.GetOrdinal("PaymentDate")),
                    Status = reader.IsDBNull("Status") ? null : reader.GetString(reader.GetOrdinal("Status")),
                    IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive")),
                    AppointmentDate = reader.GetDateTime(reader.GetOrdinal("Date")),
                    StartTime = reader.GetTimeSpan(reader.GetOrdinal("StartTime")),
                    EndTime = reader.GetTimeSpan(reader.GetOrdinal("EndTime")),
                    AppointmentStatus = reader.GetString(reader.GetOrdinal("AppointmentStatus")),
                    ClientName = reader.GetString(reader.GetOrdinal("ClientName"))
                };
            }
            return null;
        }

        public async Task<Payments> Create(Payments p)
        {
            await using var con = new SqlConnection(_connection);
            await con.OpenAsync();

            using var cmd = new SqlCommand("pay_Create", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@AppointmentId", p.AppointmentId);
            cmd.Parameters.AddWithValue("@ClientId", p.ClientId);
            cmd.Parameters.AddWithValue("@PaymentType", p.PaymentType);
            cmd.Parameters.AddWithValue("@AuthorizationNumber", (object?)p.AuthorizationNumber ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@TransactionNumber", (object?)p.TransactionNumber ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@TotalAmount", p.TotalAmount);
            cmd.Parameters.AddWithValue("@Status", (object?)p.Status ?? DBNull.Value);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                p.Success = reader.GetBoolean(reader.GetOrdinal("Success")) ? 1 : 0;
                p.Message = reader["Message"].ToString();
                if (p.Success == 1 && reader.FieldCount > 2)
                {
                    p.PaymentId = reader.GetInt32(reader.GetOrdinal("PaymentId"));
                    p.PaymentDate = reader.GetDateTime(reader.GetOrdinal("PaymentDate"));
                    p.IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive"));
                }
            }
            return p;
        }

        public async Task<Payments> Update(Payments p)
        {
            await using var con = new SqlConnection(_connection);
            await con.OpenAsync();

            using var cmd = new SqlCommand("pay_Update", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@PaymentId", p.PaymentId);
            cmd.Parameters.AddWithValue("@PaymentType", p.PaymentType);
            cmd.Parameters.AddWithValue("@AuthorizationNumber", (object?)p.AuthorizationNumber ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@TransactionNumber", (object?)p.TransactionNumber ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@TotalAmount", p.TotalAmount);
            cmd.Parameters.AddWithValue("@Status", (object?)p.Status ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@IsActive", p.IsActive);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                p.Success = reader.GetBoolean(reader.GetOrdinal("Success")) ? 1 : 0;
                p.Message = reader["Message"].ToString();
            }
            return p;
        }

        public async Task<Payments> DeleteSoft(int id)
        {
            var result = new Payments { PaymentId = id };

            await using var con = new SqlConnection(_connection);
            await con.OpenAsync();

            using var cmd = new SqlCommand("pay_DeleteSoft", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@PaymentId", id);

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