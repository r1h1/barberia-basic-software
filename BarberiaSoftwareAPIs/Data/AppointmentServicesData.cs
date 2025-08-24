using BarberiaSoftwareAPIs.Models;
using System.Data;
using System.Data.SqlClient;

namespace BarberiaSoftwareAPIs.Data
{
    public class AppointmentServicesData
    {
        private readonly string _connection;

        public AppointmentServicesData(IConfiguration configuration)
        {
            _connection = configuration.GetConnectionString("SQLConnection");
        }

        public async Task<List<AppointmentServices>> GetByAppointment(int appointmentId)
        {
            List<AppointmentServices> list = new();

            using SqlConnection con = new(_connection);
            await con.OpenAsync();

            SqlCommand cmd = new("appsvc_ListByAppointment", con)
            {
                CommandType = CommandType.StoredProcedure
            };
            cmd.Parameters.AddWithValue("@AppointmentId", appointmentId);

            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                list.Add(new AppointmentServices
                {
                    AppointmentServiceId = reader.GetInt32(reader.GetOrdinal("AppointmentServiceId")),
                    AppointmentId = reader.GetInt32(reader.GetOrdinal("AppointmentId")),
                    ServiceId = reader.GetInt32(reader.GetOrdinal("ServiceId")),
                    Quantity = reader.GetInt32(reader.GetOrdinal("Quantity")),
                    UnitPrice = reader.GetDecimal(reader.GetOrdinal("UnitPrice")),
                    TotalPrice = reader.GetDecimal(reader.GetOrdinal("TotalPrice")),
                    IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive"))
                });
            }

            return list;
        }

        public async Task<AppointmentServices?> GetById(int id)
        {
            using SqlConnection con = new(_connection);
            await con.OpenAsync();

            SqlCommand cmd = new("appsvc_GetById", con)
            {
                CommandType = CommandType.StoredProcedure
            };
            cmd.Parameters.AddWithValue("@AppointmentServiceId", id);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return new AppointmentServices
                {
                    AppointmentServiceId = reader.GetInt32(reader.GetOrdinal("AppointmentServiceId")),
                    AppointmentId = reader.GetInt32(reader.GetOrdinal("AppointmentId")),
                    ServiceId = reader.GetInt32(reader.GetOrdinal("ServiceId")),
                    Quantity = reader.GetInt32(reader.GetOrdinal("Quantity")),
                    UnitPrice = reader.GetDecimal(reader.GetOrdinal("UnitPrice")),
                    TotalPrice = reader.GetDecimal(reader.GetOrdinal("TotalPrice")),
                    IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive"))
                };
            }

            return null;
        }

        public async Task<AppointmentServices> Create(AppointmentServices model)
        {
            using SqlConnection con = new(_connection);
            await con.OpenAsync();

            SqlCommand cmd = new("appsvc_Create", con)
            {
                CommandType = CommandType.StoredProcedure
            };

            cmd.Parameters.AddWithValue("@AppointmentId", model.AppointmentId);
            cmd.Parameters.AddWithValue("@ServiceId", model.ServiceId);
            cmd.Parameters.AddWithValue("@Quantity", model.Quantity);
            cmd.Parameters.AddWithValue("@UnitPrice", model.UnitPrice);
            cmd.Parameters.AddWithValue("@TotalPrice", model.TotalPrice);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                model.Success = reader.GetInt32(0);
                model.Message = reader.GetString(1);
            }

            return model;
        }

        public async Task<AppointmentServices> Update(AppointmentServices model)
        {
            using SqlConnection con = new(_connection);
            await con.OpenAsync();

            SqlCommand cmd = new("appsvc_Update", con)
            {
                CommandType = CommandType.StoredProcedure
            };

            cmd.Parameters.AddWithValue("@AppointmentServiceId", model.AppointmentServiceId);
            cmd.Parameters.AddWithValue("@AppointmentId", model.AppointmentId);
            cmd.Parameters.AddWithValue("@ServiceId", model.ServiceId);
            cmd.Parameters.AddWithValue("@Quantity", model.Quantity);
            cmd.Parameters.AddWithValue("@UnitPrice", model.UnitPrice);
            cmd.Parameters.AddWithValue("@TotalPrice", model.TotalPrice);
            cmd.Parameters.AddWithValue("@IsActive", model.IsActive);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                model.Success = reader.GetInt32(0);
                model.Message = reader.GetString(1);
            }

            return model;
        }

        public async Task<AppointmentServices> DeleteSoft(int id)
        {
            AppointmentServices result = new();

            using SqlConnection con = new(_connection);
            await con.OpenAsync();

            SqlCommand cmd = new("appsvc_DeleteSoft", con)
            {
                CommandType = CommandType.StoredProcedure
            };
            cmd.Parameters.AddWithValue("@AppointmentServiceId", id);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                result.Success = reader.GetInt32(0);
                result.Message = reader.GetString(1);
            }

            return result;
        }
    }
}