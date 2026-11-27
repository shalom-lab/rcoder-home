d <- datasets::mtcars
d$gearbox <- factor(d$am, levels = c(0, 1),
                    labels = c("Automatic", "Manual"))
palette <- c(Automatic = "#2458c6", Manual = "#be4b10")
dir.create("output", showWarnings = FALSE)
png("output/mtcars_chart.png", width = 960, height = 680, res = 120)
plot(mpg ~ wt, data = d, pch = 19, col = palette[d$gearbox],
     xlab = "Weight (1,000 lb)", ylab = "Fuel economy (US mpg)")
legend("topright", legend = names(palette), col = palette,
       pch = 19, bty = "n")
dev.off()
summary <- aggregate(cbind(wt, mpg) ~ gearbox, data = d, FUN = mean)
summary$n <- as.integer(table(d$gearbox)[as.character(summary$gearbox)])
names(summary)[2:3] <- c("mean_weight_1000_lb", "mean_us_mpg")
summary[2:3] <- round(summary[2:3], 2)
write.csv(summary, "output/mtcars_summary.csv", row.names = FALSE)
