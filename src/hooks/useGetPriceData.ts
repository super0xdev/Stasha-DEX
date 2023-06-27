import { useEffect, useState } from 'react'

// // type ApiResponse = {
// //   data: {
// //     [address: string]: {
// //       name: string
// //       symbol: string
// //       price: string
// //       price_BNB: string
// //     }
// //   }
// //   updated_at: string
// }

/**
 * Due to Cors the api was forked and a proxy was created
 * @see https://github.com/pancakeswap/gatsby-pancake-api/commit/e811b67a43ccc41edd4a0fa1ee704b2f510aa0ba
 */
const api = 'https://pro-api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market-cap_desc&sparkline=false&x_cg_pro_api_key=CG-cYLMAXA7qqWnK5RXS8WAw5Jk'

const useGetPriceData = () => {
  const [data, setData] = useState<any | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(api)
        const res: any = await response.json()

        setData(res)
      } catch (error) {
        console.error('Unable to fetch price data:', error)
      }
    }

    fetchData()
  }, [setData])

  return data
}

export default useGetPriceData
