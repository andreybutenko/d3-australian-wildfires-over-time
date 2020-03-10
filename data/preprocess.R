library(dplyr)
library(jsonlite)

raw_data <- read.csv('fire_nrt_M6_96619.csv', stringsAsFactors = FALSE)
data <- raw_data %>% 
  select(latitude, longitude, acq_date, brightness, frp, satellite, daynight) # %>% 
  # mutate(acq_date = as.Date(acq_date, "%Y-%m-%d")) %>% 
  # filter(acq_date > as.Date('2019-11-01', '%Y-%m-%d')) %>% 
  # mutate(acq_date = as.character(acq_date))
results <- list()

for(date in unique(data$acq_date)) {
  results[[date]] <- data %>% 
    filter(acq_date == date) %>% 
    select(-acq_date) %>% 
    arrange(brightness)
}

export <- toJSON(results)
write(export, 'data.json')
