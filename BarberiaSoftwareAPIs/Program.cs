using BarberiaSoftwareAPIs.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Agregar los servicios
builder.Services.AddScoped<RolesData>();
builder.Services.AddScoped<AnnouncementsData>();
builder.Services.AddScoped<ServicesData>();
builder.Services.AddScoped<ClientsData>();
builder.Services.AddScoped<AnnouncementsData>();
builder.Services.AddScoped<AppointmentServicesData>();
builder.Services.AddScoped<AppointmentsData>();
builder.Services.AddScoped<EmployeesData>();
builder.Services.AddScoped<UsersData>();
builder.Services.AddScoped<SchedulesData>();
builder.Services.AddScoped<PaymentsData>();
builder.Services.AddScoped<AvailabilityData>();
builder.Services.AddScoped<AuthData>();


var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsProduction())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.UseCors("AllowAll");

app.MapControllers();

app.Run();
