using BarberiaSoftwareAPIs.Models;
using System.Configuration;
using System.Data.SqlClient;

namespace BarberiaSoftwareAPIs.Data
{
    public class RolesData
    {
        private readonly string connection;

        public RolesData(IConfiguration Configuration)
        {
           connection = Configuration.GetConnectionString("DefaultConnection");
        }

        public async Task<List<Roles>> GetAllRoles()
        {
            List<Roles> rolesList = new List<Roles>();
            using (var con = new SqlConnection(connection))
            { 
                await con.OpenAsync();
                SqlCommand cmd = new SqlCommand("SELECT * FROM Roles", con);
            }
        }
    }
}