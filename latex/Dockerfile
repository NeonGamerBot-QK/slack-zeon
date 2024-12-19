# Start from a LaTeX image
FROM blang/latex

# Install the required dependencies and Catppuccin theme
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Clone the Catppuccin LaTeX repository or download the theme files
RUN wget -O /root/catppuccin https://github.com/catppuccin/latex/releases/download/v1.1.0/catppuccinpalette.sty 

# Copy the necessary LaTeX theme files to the appropriate directory
RUN cp -r /root/catppuccin/* /usr/share/texmf/tex/latex/

# Update the TeX Live package database
RUN mktexlsr

# Set the working directory to /data (for mounting LaTeX files)
WORKDIR /data

# The default command is bash
CMD ["bash"]
