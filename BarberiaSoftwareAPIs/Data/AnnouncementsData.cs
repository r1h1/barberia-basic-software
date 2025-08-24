using BarberiaSoftwareAPIs.Models;
using System.Data;
using System.Data.SqlClient;

namespace BarberiaSoftwareAPIs.Data
{
    public class AnnouncementsData
    {
        private readonly string _connection;

        public AnnouncementsData(IConfiguration config)
        {
            _connection = config.GetConnectionString("SQLConnection")
                ?? throw new ArgumentNullException("SQLConnection");
        }

        public async Task<List<Announcements>> GetAll(bool onlyActive = true)
        {
            var list = new List<Announcements>();

            await using var con = new SqlConnection(_connection);
            await con.OpenAsync();

            using var cmd = new SqlCommand("ann_List", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@OnlyActive", onlyActive);

            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                list.Add(new Announcements
                {
                    AnnouncementId = reader.GetInt32(reader.GetOrdinal("AnnouncementId")),
                    EmployeeId = reader.GetInt32(reader.GetOrdinal("EmployeeId")),
                    Title = reader.GetString(reader.GetOrdinal("Title")),
                    Content = reader.IsDBNull("Content") ? null : reader.GetString(reader.GetOrdinal("Content")),
                    PublishedDate = reader.GetDateTime(reader.GetOrdinal("PublishedDate")),
                    IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive")),
                    EmployeeName = reader.GetString(reader.GetOrdinal("EmployeeName"))
                });
            }

            return list;
        }

        public async Task<Announcements?> GetById(int id)
        {
            await using var con = new SqlConnection(_connection);
            await con.OpenAsync();

            using var cmd = new SqlCommand("ann_GetById", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@AnnouncementId", id);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                return new Announcements
                {
                    AnnouncementId = reader.GetInt32(reader.GetOrdinal("AnnouncementId")),
                    EmployeeId = reader.GetInt32(reader.GetOrdinal("EmployeeId")),
                    Title = reader.GetString(reader.GetOrdinal("Title")),
                    Content = reader.IsDBNull("Content") ? null : reader.GetString(reader.GetOrdinal("Content")),
                    PublishedDate = reader.GetDateTime(reader.GetOrdinal("PublishedDate")),
                    IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive")),
                    EmployeeName = reader.GetString(reader.GetOrdinal("EmployeeName"))
                };
            }
            return null;
        }

        public async Task<Announcements> Create(Announcements a)
        {
            await using var con = new SqlConnection(_connection);
            await con.OpenAsync();

            using var cmd = new SqlCommand("ann_Create", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@EmployeeId", a.EmployeeId);
            cmd.Parameters.AddWithValue("@Title", a.Title);
            cmd.Parameters.AddWithValue("@Content", a.Content ?? (object)DBNull.Value);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                a.Success = reader.GetBoolean(reader.GetOrdinal("Success")) ? 1 : 0;
                a.Message = reader["Message"].ToString();
                if (a.Success == 1 && reader.FieldCount > 2)
                {
                    a.AnnouncementId = reader.GetInt32(reader.GetOrdinal("AnnouncementId"));
                    a.PublishedDate = reader.GetDateTime(reader.GetOrdinal("PublishedDate"));
                    a.IsActive = reader.GetBoolean(reader.GetOrdinal("IsActive"));
                }
            }
            return a;
        }

        public async Task<Announcements> Update(Announcements a)
        {
            await using var con = new SqlConnection(_connection);
            await con.OpenAsync();

            using var cmd = new SqlCommand("ann_Update", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@AnnouncementId", a.AnnouncementId);
            cmd.Parameters.AddWithValue("@Title", a.Title);
            cmd.Parameters.AddWithValue("@Content", a.Content ?? (object)DBNull.Value);
            cmd.Parameters.AddWithValue("@IsActive", a.IsActive);

            using var reader = await cmd.ExecuteReaderAsync();
            if (await reader.ReadAsync())
            {
                a.Success = reader.GetBoolean(reader.GetOrdinal("Success")) ? 1 : 0;
                a.Message = reader["Message"].ToString();
            }
            return a;
        }

        public async Task<Announcements> DeleteSoft(int id)
        {
            var result = new Announcements { AnnouncementId = id };

            await using var con = new SqlConnection(_connection);
            await con.OpenAsync();

            using var cmd = new SqlCommand("ann_DeleteSoft", con) { CommandType = CommandType.StoredProcedure };
            cmd.Parameters.AddWithValue("@AnnouncementId", id);

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