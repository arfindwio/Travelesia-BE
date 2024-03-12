module.exports = {
  formattedDate: (timestamp) => {
    let date = new Date(timestamp);
    let options = { day: "numeric", month: "long", year: "numeric" };
    let formattedDate = date.toLocaleDateString("id-ID", options);
    return formattedDate;
  },

  convertDateTime: (datetimeString) => {
    const datetime = new Date(datetimeString);

    // Array untuk nama bulan
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    // Mendapatkan informasi tanggal, bulan, dan tahun
    const date = datetime.getDate();
    const month = months[datetime.getMonth()];
    const year = datetime.getFullYear();

    // Mendapatkan informasi jam dan menit
    const hours = datetime.getHours().toString().padStart(2, "0");
    const minutes = datetime.getMinutes().toString().padStart(2, "0");

    // Menghasilkan format yang diinginkan
    const formattedDateTime = `${hours}:${minutes} ${date} ${month} ${year}`;

    return formattedDateTime;
  },
};
