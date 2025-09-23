import pygrib

grbs = pygrib.open("era5_ph_wind_wave.grib")

# List all messages (variables) in the GRIB
for grb in grbs:
    print(grb.name, grb.shortName, grb.level, grb.values.shape)
